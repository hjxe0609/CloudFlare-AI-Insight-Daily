// src/handlers/commitToGitHub.js
import { getISODate, formatMarkdownText } from '../helpers.js';
import { getGitHubFileSha, createOrUpdateGitHubFile } from '../github.js';
import { generateGitHubCommitStatusPageHtml } from '../htmlGenerators.js';

export async function handleCommitToGitHub(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    try {
        const formData = await request.formData();
        const dateStr = formData.get('date') || getISODate();
        const promptsMd = formData.get('prompts_markdown');
        const dailyMd = formData.get('daily_summary_markdown');
        const podcastMd = formData.get('podcast_script_markdown');

        if (!promptsMd || !dailyMd || !podcastMd) {
            throw new Error("Missing markdown content for GitHub commit.");
        }

        const results = [];
        const filesToCommit = [
            { path: `prompt/${dateStr}.md`, content: promptsMd, description: "Prompts File" },
            { path: `daily/${dateStr}.md`, content: formatMarkdownText(dailyMd), description: "Daily Summary File" },
            { path: `podcast/${dateStr}.md`, content: podcastMd, description: "Podcast Script File" },
        ];

        for (const file of filesToCommit) {
            try {
                const existingSha = await getGitHubFileSha(env, file.path);
                const commitMessage = `${existingSha ? 'Update' : 'Create'} ${file.description.toLowerCase()} for ${dateStr}`;
                await createOrUpdateGitHubFile(env, file.path, file.content, commitMessage, existingSha);
                results.push({ file: file.path, status: 'Success', message: `Successfully ${existingSha ? 'updated' : 'created'}.` });
                console.log(`GitHub commit success for ${file.path}`);
            } catch (err) {
                console.error(`Failed to commit ${file.path} to GitHub:`, err);
                results.push({ file: file.path, status: 'Failed', message: err.message });
            }
        }
        
        const pageHtml = generateGitHubCommitStatusPageHtml(dateStr, results);
        return new Response(pageHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    } catch (error) {
        console.error("Error in /commitToGitHub:", error);
        const dateStr = (await request.formData().catch(() => new FormData())).get('date') || getISODate(); // Attempt to get date for error page
        const errorHtml = generateGitHubCommitStatusPageHtml(dateStr, [{file: "Overall Operation", status: "Failed", message: error.message}]);
        return new Response(errorHtml, { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
}