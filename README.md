# AI 洞察日报

## 项目简介

“AI 洞察日报”是一个基于 **Cloudflare Workers** 开发的**内容聚合与生成平台**。该项目旨在为用户提供每日精选的 **AI 领域新闻**、**热门开源项目推荐**以及**最新学术论文摘要**。通过整合多个**数据源**和先进的 **AI 模型**（如 **Google Gemini**），“AI 洞察日报”能够自动抓取、处理、分析并生成**高质量的 AI 内容**，并将其发布到 **GitHub 仓库**，实现内容的**更新与分发**。

本项目致力于成为您在瞬息万变的 AI 领域保持领先的得力助手。凭借其**高效的数据处理能力**和**海量的优质内容来源**，确保您不错过任何重要的信息和趋势。

快速开始： 我们优先支持 **Folo** 数据源，仅需配置**Cookie**和**订阅源id**即可轻松获取订阅内容。

灵活拓展： 项目具备出色的拓展性，支持二次开发，通过添加相应的 API 接口实现，即可接入其他数据源。

了解如何添加新数据源，请参考：[项目拓展性：如何添加新的数据源](#项目拓展性如何添加新的数据源)

[AI 洞察日报 在线地址1](https://justlovemaki.github.io/CloudFlare-AI-Insight-Daily/today/book/)             
[AI 洞察日报 在线地址2](https://ai-today.justlikemaki.vip/)

[播客-小宇宙-来生小酒馆](https://www.xiaoyuzhoufm.com/podcast/683c62b7c1ca9cf575a5030e)            
[播客-抖音-来生情报站](https://www.douyin.com/user/MS4wLjABAAAAwpwqPQlu38sO38VyWgw9ZjDEnN4bMR5j8x111UxpseHR9DpB6-CveI5KRXOWuFwG)

## 核心功能详解

“AI 洞察日报”提供以下主要功能，旨在全面覆盖 AI 领域的重要信息，并以高效、智能的方式呈现给用户：

### 1. 多源数据聚合：

项目能够从多个权威和热门平台聚合 AI 相关数据，确保内容的**实效性**、**广泛性**和**深度**。

-   **AI 新闻资讯**：从 `aibase.com` 等知名 AI 资讯平台抓取最新的 AI 相关新闻。这些新闻数据以标准的 **JSON Feed 格式**呈现，每篇文章都包含详细的标题、内容（HTML 格式）、发布日期和作者等关键信息。这保证了用户能够及时获取行业动态，了解 AI 领域的最新进展和重要事件。
-   **热门开源项目推荐**：每日从 **GitHub 趋势榜**自动抓取最受关注的 AI 相关开源项目。项目信息涵盖了项目 URL、所有者、项目名称、简洁明了的描述、所使用的编程语言、星标数、分支数以及贡献者头像等。这些数据为开发者和研究人员提供了宝贵的参考，帮助他们发现有潜力的项目，跟进技术潮流。
-   **学术论文摘要**：从 **Hugging Face Daily Papers** 等领先的学术平台获取最新的 AI 领域研究论文。论文数据同样以 **JSON Feed 格式**提供，包含论文标题、摘要内容（HTML 格式）、发布日期和作者等。这使得用户能够快速浏览前沿研究成果，了解 AI 理论和应用领域的最新突破。
-   **Folo 数据**：通过 Folo API 和Cookie 抓取订阅源内容，支持列表和订阅源类型，并可进行分页处理，极大地扩展了内容来源的灵活性和多样性。

### 2. 内容处理与存储：

项目利用 **Cloudflare Workers** 的强大能力，高效地从各个 **API 接口**获取原始数据。获取的数据经过标准化处理后，会存储到 **Cloudflare KV (Key-Value) 存储**中，确保数据的**持久化**和**快速访问**。这种设计使得每日的 AI 洞察内容能够被有效地管理和检索，为后续的内容生成和展示奠定基础。
-   **KV 命名空间**：`DATA_KV` (配置于 `wrangler.toml`)，用于存储和管理所有聚合而来的数据。

### 3. AI 内容生成：

“AI 洞察日报”深度整合了多种先进的 **AI 模型**，能够对聚合的内容进行**深度分析**和**智能摘要**。用户可以通过 `/genAIContent` 端点触发 **AI 内容生成**，获得精炼的摘要或洞察报告。这大大提升了内容的阅读效率和信息密度，帮助用户在短时间内掌握核心要点。
-   **支持模型**：项目通过 `wrangler.toml` 中的 `USE_MODEL_PLATFORM` 变量灵活配置支持的 AI 模型平台，目前主要支持 **Google Gemini** 和 **OpenAI 兼容模型**。
    -   **Google Gemini**：通过 `GEMINI_API_KEY`、`GEMINI_API_URL` 和 `DEFAULT_GEMINI_MODEL` 进行配置，例如 `gemini-2.5-flash-preview-05-20`。
    -   **OpenAI 兼容模型**：通过 `OPENAI_API_KEY`、`OPENAI_API_URL` 和 `DEFAULT_OPEN_MODEL` 进行配置，例如 `deepseek-chat`。这使得项目能够接入如 DeepSeek 等兼容 OpenAI API 的服务。
-   **配置模型**：通过 `wrangler.toml` 中的相关变量进行灵活配置，以适应不同的 AI 服务提供商和模型版本。

### 4. GitHub 发布：

生成的内容可以通过 `/commitToGitHub` 端点**自动提交**到指定的 **GitHub 仓库**。这实现了内容的**发布**和**版本控制**，方便用户追踪每日更新，并可进一步整合到其他流程中，如 CI/CD 流水线，实现内容的无缝分发。
-   **配置信息**：`GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_BRANCH` 等变量在 `wrangler.toml` 中进行配置，确保安全且可控的 GitHub 操作。

### 5. 用户认证与管理：

项目内置了基于 **Cookie** 的简单**用户认证机制**，通过 `/login` 和 `/logout` 端点管理用户会话。这确保了只有经过授权的用户才能访问和操作敏感的**内容生成与发布功能**，提升了项目的**安全性**和**数据完整性**。
-   **配置凭证**：`LOGIN_USERNAME`, `LOGIN_PASSWORD` 在 `wrangler.toml` 中设置，用于简单的身份验证。

### 6. 友好的内容展示：

通过 `/getContentHtml` 端点，用户可以以 **HTML 格式**浏览每日的 AI 洞察内容，提供良好的阅读体验。内容展示页面支持**内容选择功能**，方便用户挑选需要 AI 摘要的特定项目，实现个性化的信息获取。

### 7. 其他辅助功能：

-   **播客内容生成**：支持生成播客相关的内容，例如播客标题、开场白和结尾语，为播客创作者提供便利。
    -   **配置信息**：`PODCAST_TITLE`, `PODCAST_BEGIN`, `PODCAST_END` 等变量用于定制播客内容。
-   **翻译功能**：可选择开启或关闭翻译功能，通过 `OPEN_TRANSLATE` 配置项控制，满足不同语言用户的需求。

## 技术架构与部署

“AI 洞察日报”基于 **Cloudflare Workers 平台**构建，充分利用了其**无服务器**、**边缘计算**和**全球分发**的优势，确保了服务的高可用性和低延迟。

-   **Cloudflare Workers**：作为**核心执行环境**，处理所有的 HTTP 请求、数据抓取、AI 处理和数据存储逻辑。其**轻量级**和**高性能**的特性确保了服务的**快速响应**和**可扩展性**，无需管理复杂的服务器基础设施。
-   **Cloudflare KV 存储**：用于存储每日聚合和处理后的 AI 内容，提供**低延迟的数据读写能力**，非常适合存储非结构化或半结构化数据。
-   **外部 API 整合**：项目通过集成多种外部 API 来丰富内容来源和功能：
    -   **AI 模型 API**：包括 **Google Gemini API** 和 **OpenAI 兼容 API**，用于**自然语言处理**和**内容生成**，提供强大的 AI 能力，支持多种模型选择。
    -   **RSSHub (aibase/news, huggingface/daily-papers)**：作为新闻和论文的**主要数据来源**，通过 RSS 订阅方式获取最新内容。
    -   **Git Trending API**：作为**开源项目推荐**的数据来源，实时获取 GitHub 上的热门项目。
    -   **GitHub API**：用于将生成的内容**自动提交到 GitHub 仓库**，实现内容的发布和版本控制。
    -   **Folo API**：用于抓取订阅源内容，进一步扩展了数据聚合能力。
-   **HTML/CSS/JavaScript**：用于前端登录页面和内容展示页面的渲染，提供直观的用户交互界面。
-   **Wrangler**：用于本地开发和部署项目，简化了 Cloudflare Workers 的配置和管理。

本项目通过 `wrangler.toml` 文件进行详细配置，其中包含了多个重要的**环境变量**，用于控制项目的各项功能和行为。以下是主要配置项的详细说明：

-   **`name`**：项目的名称，用于 Cloudflare Workers 部署时的标识。
-   **`main`**：Worker 脚本的主入口文件路径。
-   **`compatibility_date`**：Cloudflare Workers 的兼容性日期，用于指定 Worker 运行时行为。建议使用最新的兼容性日期以获得最新功能和行为。
-   **`workers_dev`**：在开发模式下是否启用 Worker，设置为 `true` 可以在 `workers.dev` 子域上预览。

-   **`kv_namespaces`**：Cloudflare KV 命名空间配置。
    -   `binding`：KV 命名空间的绑定名称，例如 `DATA_KV`。
    -   `id`：KV 命名空间的 ID，用于存储聚合数据。

-   **`[vars]`**：环境变量配置部分。
    -   **`OPEN_TRANSLATE`**：是否开启翻译功能，`"true"` 为开启，`"false"` 为关闭。
    -   **`USE_MODEL_PLATFORM`**：使用的 AI 模型平台，可选值包括 `"GEMINI"` (Google Gemini) 或 `"OPENAI"` (OpenAI 兼容 API)。
    -   **`GEMINI_API_KEY`**：Google Gemini API 密钥。
    -   **`GEMINI_API_URL`**：Google Gemini API 服务地址。
    -   **`DEFAULT_GEMINI_MODEL`**：默认使用的 Google Gemini 模型，例如 `"gemini-2.5-flash-preview-05-20"`。
    -   **`OPENAI_API_KEY`**：OpenAI 兼容 API 密钥 (例如 DeepSeek, OpenAI 等)。
    -   **`OPENAI_API_URL`**：OpenAI 兼容 API 服务地址。
    -   **`DEFAULT_OPEN_MODEL`**：默认使用的 OpenAI 兼容模型，例如 `"deepseek-chat"`。
    -   **`FOLO_COOKIE_KV_KEY`**：Folo 数据抓取相关的 Cookie KV 存储键。
    -   **`FOLO_DATA_API`**：Folo 数据 API 地址。
    -   **`FOLO_FILTER_DAYS`**：Folo 数据过滤天数，只抓取最近指定天数内的数据。
    -   **`AIBASE_FEED_ID`**：AIBase 新闻数据源的 Feed ID。
    -   **`AIBASE_FETCH_PAGES`**：AIBase 新闻抓取页数。
    -   **`XIAOHU_FEED_ID`**：小互日报数据源的 Feed ID。
    -   **`XIAOHU_FETCH_PAGES`**：小互日报抓取页数。
    -   **`HGPAPERS_FEED_ID`**：Hugging Face Daily Papers 数据源的 Feed ID。
    -   **`HGPAPERS_FETCH_PAGES`**：Hugging Face Daily Papers 抓取页数。
    -   **`TWITTER_LIST_ID`**：Twitter 内容数据源的列表 ID。
    -   **`TWITTER_FETCH_PAGES`**：Twitter 内容抓取页数。
    -   **`PROJECTS_API_URL`**：开源项目推荐 API 地址。
    -   **`GITHUB_TOKEN`**：GitHub 个人访问令牌，用于自动提交内容到 GitHub 仓库。
    -   **`GITHUB_REPO_OWNER`**：GitHub 仓库所有者。
    -   **`GITHUB_REPO_NAME`**：GitHub 仓库名称。
    -   **`GITHUB_BRANCH`**：GitHub 目标分支。
    -   **`LOGIN_USERNAME`**：登录用户名，用于用户认证。
    -   **`LOGIN_PASSWORD`**：登录密码，用于用户认证。
    -   **`DAILY_TITLE`**：每日洞察日报的标题。
    -   **`PODCAST_TITLE`**：播客标题。
    -   **`PODCAST_BEGIN`**：播客开场白。
    -   **`PODCAST_END`**：播客结束语。

这些配置使得项目能够**灵活地适应不同的环境和需求**，同时也保证了**敏感信息的安全性**。

## 项目价值与未来展望

“AI 洞察日报”为 **AI 领域的从业者、研究者和爱好者**提供了一个**便捷、高效的信息获取渠道**。通过**信息聚合**和 **AI 内容生成**，它极大地节省了用户筛选和阅读大量信息的时间，帮助他们快速掌握**行业动态**和**技术趋势**，从而在快速发展的 AI 领域中保持竞争力。

未来，本项目具有广阔的扩展空间，例如：

-   **增加更多数据来源**：可以集成更多垂直领域的 AI 资讯平台、技术博客、论坛等，涵盖更广泛的 AI 领域信息。
-   **提供更丰富的 AI 内容生成模式**：除了摘要，还可以开发如**趋势分析报告**、**技术对比分析**、**预测性洞察**等更高级的 AI 内容生成功能。
-   **开发更完善的用户界面**：构建一个功能更强大、交互更友好的前端界面，提升**用户体验**，例如增加个性化订阅、内容筛选、关键词搜索等功能。
-   **支持多语言内容处理和发布**：扩展项目的多语言能力，服务全球范围内的 AI 爱好者。
-   **集成更多 AI 模型**：支持更多先进的 AI 模型，提供更优质的内容生成服务。

通过持续的迭代和优化，“AI 洞察日报”将成为 AI 领域信息获取和知识管理的重要工具。

## 项目拓展性：如何添加新的数据源

“AI 洞察日报”项目设计具有良好的可扩展性，允许开发者轻松集成新的数据源，以丰富内容类型或增加现有类型的覆盖范围。以下是添加新数据源的详细步骤：

1.  **创建新的数据源文件**：
    -   在 `src/dataSources/` 目录下创建一个新的 JavaScript 文件，例如 `src/dataSources/yourNewDataSource.js`。
    -   这个文件需要导出一个包含两个核心方法的对象：
        -   `fetch(env)`：一个异步函数，负责从外部 API 获取原始数据。`env` 参数包含了 `wrangler.toml` 中配置的环境变量，你可以利用这些变量来配置 API 密钥、URL 等。
        -   `transform(rawData, sourceType)`：一个函数，负责将 `fetch` 方法获取到的原始数据转换为项目统一的数据格式。统一格式应包含 `id`, `url`, `title`, `content_html` (或 `description`), `date_published` (或 `pubDate`), `authors` (或 `author`) 等字段，以便项目能够正确处理和展示。`sourceType` 参数表示当前数据源的类型（例如 'news', 'project'）。
        -   `generateHtml(item)` (可选)：一个函数，如果该数据源的内容需要特定的 HTML 渲染方式，则实现此方法。它接收一个统一格式的 `item` 对象，并返回用于在前端页面展示的 HTML 字符串。如果未提供此方法，系统将使用默认的 HTML 渲染逻辑。注意：同一分类下，只有第一个数据源需要实现 `generateHtml` 方法。

    **示例 `src/dataSources/yourNewDataSource.js` 结构：**
    ```javascript
    // src/dataSources/yourNewDataSource.js
    const YourNewDataSource = {
        type: 'your-new-type', // 定义数据源的唯一类型标识
        async fetch(env) {
            // 使用 env.YOUR_API_KEY, env.YOUR_API_URL 等配置进行 API 请求
            const response = await fetch(env.YOUR_API_URL);
            const data = await response.json();
            return data; // 返回原始数据
        },
        transform(rawData, sourceType) {
            // 将原始数据转换为统一格式
            return rawData.items.map(item => ({
                id: item.id,
                url: item.url,
                title: item.title,
                content_html: item.content, // 或 item.description
                published_date: item.publishedAt, // 或 item.date_published
                authors: [{ name: item.author }], // 或 item.authors
                source_type: sourceType, // 标记数据来源类型
            }));
        },
        generateHtml(item) {
            // 可选：自定义 HTML 渲染逻辑
            return `
                <h3><a href="${item.url}" target="_blank">${item.title}</a></h3>
                <small>发布日期: ${new Date(item.published_date).toLocaleDateString()} - 作者: ${item.authors.map(a => a.name).join(', ')}</small>
                <div class="content-html">${item.content_html}</div>
            `;
        }
    };
    export default YourNewDataSource;
    ```

2.  **导入新的数据源**：
    -   打开 `src/dataFetchers.js` 文件。
    -   在文件顶部，使用 `import` 语句导入你新创建的数据源模块：
        ```javascript
        import YourNewDataSource from './dataSources/yourNewDataSource.js';
        ```

3.  **注册新的数据源**：
    -   在 `src/dataFetchers.js` 文件中找到 `dataSources` 对象。
    -   根据你的需求，将新的数据源添加到现有类型（如 `news`, `project`, `paper`, `socialMedia`）的 `sources` 数组中，或者创建一个新的数据类型并添加进去。
    -   **添加到现有类型示例**：
        ```javascript
        export const dataSources = {
            news: { name: '新闻', sources: [AibaseDataSource, XiaohuDataSource, YourNewDataSource] },
            // ... 其他类型
        };
        ```
    -   **创建新的数据类型示例**：
        ```javascript
        export const dataSources = {
            // ... 现有类型
            yourNewCategory: { name: '你的新类别名称', sources: [YourNewDataSource] },
        };
        ```

4.  **更新 `wrangler.toml` (如果需要)**：
    -   如果你的新数据源需要额外的 API 密钥、URL 或其他配置，请在 `wrangler.toml` 文件的 `[vars]` 部分添加相应的环境变量。
    -   例如：
        ```toml
        [vars]
        # ... 其他变量
        YOUR_API_KEY = "your_api_key_here"
        YOUR_API_URL = "https://api.yournewsource.com"
        ```

5.  **调整提示词 (如果需要 AI 处理)**：
    -   如果新添加的数据源内容需要通过 AI 模型进行摘要、格式化或生成其他形式的内容，你可能需要调整或创建新的提示词。
    -   **创建新的提示词文件**：在 `src/prompt/` 目录下，可以创建新的 JavaScript 文件（例如 `yourNewPrompt.js`）来定义如何根据新数据源的特点构建 AI 提示词。同时，可以创建相应的 Markdown 文件（例如 `systemPromptYourNewType.md`）来存储系统提示词的文本内容。
    -   **在 `src/handlers/genAIContent.js` 中集成**：根据新数据源的类型，修改 `src/handlers/genAIContent.js` 文件。这通常包括：
        -   引入并调用新的提示词逻辑（如果创建了新的提示词文件）。
        -   在 `handleGenAIContent` 函数内部的 `switch (item.type)` 语句中，为新的 `item.type` 添加一个 `case`，定义如何从新数据源的统一格式数据中提取文本内容，作为 AI 模型的输入。

通过以上步骤，你就可以轻松地为“AI 洞察日报”项目添加新的数据源，使其能够聚合更多样化的 AI 相关内容，或其他垂直领域的信息。这使得项目的功能更加丰富，同时也为开发者提供了一个灵活的扩展机制，以满足不断变化的需求。
