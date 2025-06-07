// src/handlers/genAIContent.js
import { getISODate, escapeHtml, stripHtml, removeMarkdownCodeBlock, formatDateToChinese, convertEnglishQuotesToChinese} from '../helpers.js';
import { getFromKV } from '../kv.js';
import { callChatAPIStream } from '../chatapi.js';
import { generateGenAiPageHtml } from '../htmlGenerators.js';
import { dataSources } from '../dataFetchers.js'; // Import dataSources
import { getSystemPromptSummarization } from '../prompt/summarizationPrompt.js';
import { getSystemPromptPodcastFormatting } from '../prompt/podcastFormattingPrompt.js';

export async function handleGenAIContent(request, env) {
    let dateStr;
    let selectedItemsParams = [];
    let formData;

    let userPromptSummarizationData = null;
    let fullPromptForCall1_System = null;
    let fullPromptForCall1_User = null;
    let outputOfCall1 = null;

    let userPromptPodcastFormattingData = null;
    let fullPromptForCall2_System = null;
    let fullPromptForCall2_User = null;
    let finalAiResponse = null;

    try {
        formData = await request.formData();
        const dateParam = formData.get('date');
        dateStr = dateParam ? dateParam : getISODate();
        selectedItemsParams = formData.getAll('selectedItems');

        if (selectedItemsParams.length === 0) {
            const errorHtml = generateGenAiPageHtml('生成AI内容出错，未选生成条目', '<p><strong>No items were selected.</strong> Please go back and select at least one item.</p>', dateStr, true, null);
            return new Response(errorHtml, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        
        console.log(`Generating AI content for ${selectedItemsParams.length} selected item references from date ${dateStr}`);

        const allFetchedData = {};
        const fetchPromises = [];
        for (const sourceType in dataSources) {
            if (Object.hasOwnProperty.call(dataSources, sourceType)) {
                fetchPromises.push(
                    getFromKV(env.DATA_KV, `${dateStr}-${sourceType}`).then(data => {
                        allFetchedData[sourceType] = data || [];
                    })
                );
            }
        }
        await Promise.allSettled(fetchPromises);

        const selectedContentItems = [];
        let validItemsProcessedCount = 0;

        for (const selection of selectedItemsParams) {
            const [type, idStr] = selection.split(':');
            const itemsOfType = allFetchedData[type];
            const item = itemsOfType ? itemsOfType.find(dataItem => String(dataItem.id) === idStr) : null;

            if (item) {
                let itemText = "";
                // Dynamically generate itemText based on item.type
                // Add new data sources
                switch (item.type) {
                    case 'news':
                        itemText = `News Title: ${item.title}\nPublished: ${item.published_date}\nContent Summary: ${stripHtml(item.details.content_html)}...`;
                        break;
                    case 'project':
                        itemText = `Project Name: ${item.title}\nPublished: ${item.published_date}\nUrl: ${item.url}\nDescription: ${item.description}\nStars: ${item.details.totalStars}`;
                        break;
                    case 'paper':
                        itemText = `Papers Title: ${item.title}\nPublished: ${item.published_date}\nUrl: ${item.url}\nAbstract/Content Summary: ${stripHtml(item.details.content_html)}...`;
                        break;
                    case 'socialMedia':
                        itemText = `socialMedia Post by ${item.authors}：Published: ${item.published_date}\nUrl: ${item.url}\nContent: ${stripHtml(item.details.content_html)}...`;
                        break;
                    default:
                        // Fallback for unknown types or if more specific details are not available
                        itemText = `Type: ${item.type}\nTitle: ${item.title || 'N/A'}\nDescription: ${item.description || 'N/A'}\nURL: ${item.url || 'N/A'}`;
                        if (item.published_date) itemText += `\nPublished: ${item.published_date}`;
                        if (item.source) itemText += `\nSource: ${item.source}`;
                        if (item.details && item.details.content_html) itemText += `\nContent: ${stripHtml(item.details.content_html)}...`;
                        break;
                }
                
                if (itemText) {
                    selectedContentItems.push(itemText);
                    validItemsProcessedCount++;
                }
            } else {
                console.warn(`Could not find item for selection: ${selection} on date ${dateStr}.`);
            }
        }

        if (validItemsProcessedCount === 0) {
            const errorHtml = generateGenAiPageHtml('生成AI内容出错，可生成条目为空', '<p><strong>Selected items could not be retrieved or resulted in no content.</strong> Please check the data or try different selections.</p>', dateStr, true, selectedItemsParams);
            return new Response(errorHtml, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        
        //提示词内不能有英文引号，否则会存储数据缺失。
        fullPromptForCall1_System = getSystemPromptSummarization();
        userPromptSummarizationData = selectedContentItems.join('\n\n---\n\n');
        fullPromptForCall1_User = userPromptSummarizationData;

        console.log("Call 1 to Chat (Summarization): User prompt length:", userPromptSummarizationData.length);
        try {
            let summarizedChunks = [];
            for await (const chunk of callChatAPIStream(env, userPromptSummarizationData, fullPromptForCall1_System)) {
                summarizedChunks.push(chunk);
            }
            outputOfCall1 = summarizedChunks.join('');
            if (!outputOfCall1 || outputOfCall1.trim() === "") throw new Error("Chat summarization call returned empty content.");
            outputOfCall1 = removeMarkdownCodeBlock(outputOfCall1); // Clean the output
            console.log("Call 1 (Summarization) successful. Output length:", outputOfCall1.length);
        } catch (error) {
            console.error("Error in Chat API Call 1 (Summarization):", error);
            const errorHtml = generateGenAiPageHtml('生成AI内容出错(内容摘要)', `<p><strong>Failed during summarization:</strong> ${escapeHtml(error.message)}</p>${error.stack ? `<pre>${escapeHtml(error.stack)}</pre>` : ''}`, dateStr, true, selectedItemsParams, fullPromptForCall1_System, fullPromptForCall1_User);
            return new Response(errorHtml, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        userPromptPodcastFormattingData = outputOfCall1;
        fullPromptForCall2_System = getSystemPromptPodcastFormatting(env);
        fullPromptForCall2_User = userPromptPodcastFormattingData;

        console.log("Call 2 to Chat (Podcast Formatting): User prompt length:", userPromptPodcastFormattingData.length);
        try {
            let podcastChunks = [];
            for await (const chunk of callChatAPIStream(env, userPromptPodcastFormattingData, fullPromptForCall2_System)) {
                podcastChunks.push(chunk);
            }
            finalAiResponse = podcastChunks.join('');
            if (!finalAiResponse || finalAiResponse.trim() === "") throw new Error("Chat podcast formatting call returned empty content.");
            finalAiResponse = removeMarkdownCodeBlock(finalAiResponse); // Clean the output
            console.log("Call 2 (Podcast Formatting) successful. Final output length:", finalAiResponse.length);
        } catch (error) {
            console.error("Error in Chat API Call 2 (Podcast Formatting):", error);
            const errorHtml = generateGenAiPageHtml('生成AI内容出错(播客文案)', `<p><strong>Failed during podcast formatting:</strong> ${escapeHtml(error.message)}</p>${error.stack ? `<pre>${escapeHtml(error.stack)}</pre>` : ''}`, dateStr, true, selectedItemsParams, fullPromptForCall1_System, fullPromptForCall1_User, fullPromptForCall2_System, fullPromptForCall2_User);
            return new Response(errorHtml, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        
        let promptsMarkdownContent = `# Prompts for ${dateStr}\n\n`;
        promptsMarkdownContent += `## Call 1: Content Summarization\n\n`;
        if (fullPromptForCall1_System) promptsMarkdownContent += `### System Instruction\n\`\`\`\n${fullPromptForCall1_System}\n\`\`\`\n\n`;
        if (fullPromptForCall1_User) promptsMarkdownContent += `### User Input\n\`\`\`\n${fullPromptForCall1_User}\n\`\`\`\n\n`;
        promptsMarkdownContent += `## Call 2: Podcast Formatting\n\n`;
        if (fullPromptForCall2_System) promptsMarkdownContent += `### System Instruction\n\`\`\`\n${fullPromptForCall2_System}\n\`\`\`\n\n`;
        if (fullPromptForCall2_User) promptsMarkdownContent += `### User Input (Output of Call 1)\n\`\`\`\n${fullPromptForCall2_User}\n\`\`\`\n\n`;

        let dailySummaryMarkdownContent = `# ${env.DAILY_TITLE} ${formatDateToChinese(dateStr)}\n\n${removeMarkdownCodeBlock(outputOfCall1)}`;
        let podcastScriptMarkdownContent = `# ${env.PODCAST_TITLE} ${formatDateToChinese(dateStr)}\n\n${removeMarkdownCodeBlock(finalAiResponse)}`;

        const successHtml = generateGenAiPageHtml(
            'AI播客脚本',
            escapeHtml(finalAiResponse), 
            dateStr, false, selectedItemsParams,
            fullPromptForCall1_System, fullPromptForCall1_User,
            fullPromptForCall2_System, fullPromptForCall2_User,
            convertEnglishQuotesToChinese(removeMarkdownCodeBlock(promptsMarkdownContent)), 
            convertEnglishQuotesToChinese(dailySummaryMarkdownContent), 
            convertEnglishQuotesToChinese(podcastScriptMarkdownContent)
        );
        return new Response(successHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    } catch (error) {
        console.error("Error in /genAIContent (outer try-catch):", error);
        const pageDateForError = dateStr || getISODate(); 
        const itemsForActionOnError = Array.isArray(selectedItemsParams) ? selectedItemsParams : [];
        const errorHtml = generateGenAiPageHtml('Server Error Generating AI Content', `<p><strong>Unexpected error:</strong> ${escapeHtml(error.message)}</p>${error.stack ? `<pre>${escapeHtml(error.stack)}</pre>` : ''}`, pageDateForError, true, itemsForActionOnError, fullPromptForCall1_System, fullPromptForCall1_User, fullPromptForCall2_System, fullPromptForCall2_User);
        return new Response(errorHtml, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
}
