// src/index.js
import { handleWriteData } from './handlers/writeData.js';
import { handleGetContent } from './handlers/getContent.js';
import { handleGetContentHtml } from './handlers/getContentHtml.js';
import { handleGenAIContent } from './handlers/genAIContent.js';
import { handleCommitToGitHub } from './handlers/commitToGitHub.js';
import { dataSources } from './dataFetchers.js'; // Import dataSources

const SESSION_COOKIE_NAME = 'session_id';
const SESSION_EXPIRATION_SECONDS = 60 * 60; // 1 hour

// Function to generate the login page HTML
function generateLoginPage(redirectUrl) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f4f4f4; margin: 0; }
                .login-container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
                h2 { color: #333; margin-bottom: 20px; }
                .form-group { margin-bottom: 15px; text-align: left; }
                label { display: block; margin-bottom: 5px; color: #555; }
                input[type="text"], input[type="password"] { width: calc(100% - 20px); padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
                button:hover { background-color: #0056b3; }
                .error-message { color: red; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="login-container">
                <h2>Login</h2>
                <form id="loginForm" method="POST" action="/login">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <input type="hidden" name="redirect" value="${redirectUrl}">
                    <button type="submit">Login</button>
                    <p id="errorMessage" class="error-message"></p>
                </form>
                <script>
                    const form = document.getElementById('loginForm');
                    const errorMessage = document.getElementById('errorMessage');
                    form.addEventListener('submit', async (event) => {
                        event.preventDefault();
                        const formData = new FormData(form);
                        const response = await fetch('/login', {
                            method: 'POST',
                            body: new URLSearchParams(formData).toString(),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        });
                        if (response.ok) {
                            const redirectUrl = response.headers.get('X-Redirect-Url');
                            if (redirectUrl) {
                                window.location.href = redirectUrl;
                            } else {
                                window.location.href = '/'; // Fallback to home
                            }
                        } else {
                            const errorText = await response.text();
                            errorMessage.textContent = errorText || 'Login failed. Please try again.';
                        }
                    });
                </script>
            </div>
        </body>
        </html>
    `;
}

// Function to handle login requests
async function handleLogin(request, env) {
    if (request.method === 'GET') {
        const url = new URL(request.url);
        const redirectUrl = url.searchParams.get('redirect') || '/';
        return new Response(generateLoginPage(redirectUrl), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    } else if (request.method === 'POST') {
        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');
        const redirect = formData.get('redirect') || '/';

        if (username === env.LOGIN_USERNAME && password === env.LOGIN_PASSWORD) {
            const sessionId = crypto.randomUUID(); // Generate a simple session ID
            const expirationDate = new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000);
            const cookie = `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; Expires=${expirationDate.toUTCString()}; HttpOnly; Secure; SameSite=Lax`;

            // In a real application, you'd store sessionId in a KV store or similar
            // For this example, we'll just rely on the cookie for simplicity.
            // If you need persistent sessions, uncomment and implement KV storage:
            // await env.DATA_KV.put(`session:${sessionId}`, 'valid', { expirationTtl: SESSION_EXPIRATION_SECONDS });

            return new Response('Login successful', {
                status: 200,
                headers: {
                    'Set-Cookie': cookie,
                    'X-Redirect-Url': redirect, // Custom header for client-side redirect
                },
            });
        } else {
            return new Response('Invalid username or password', { status: 401 });
        }
    }
    return new Response('Method Not Allowed', { status: 405 });
}

// Function to check session cookie
async function isAuthenticated(request, env) {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
        return false;
    }

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(cookie => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (!sessionCookie) {
        return false;
    }

    const sessionId = sessionCookie.split('=')[1];

    // In a real application, you'd validate sessionId against a KV store or similar
    // For this example, we'll consider any present session_id cookie as valid.
    // If you need persistent sessions, uncomment and implement KV validation:
    // const storedSession = await env.DATA_KV.get(`session:${sessionId}`);
    // return storedSession === 'valid';

    return true; // For simplicity, assume any session_id cookie means authenticated
}

// Function to handle logout requests
async function handleLogout(request) {
    const expiredDate = new Date(0); // Set expiration to a past date
    const cookie = `${SESSION_COOKIE_NAME}=; Path=/; Expires=${expiredDate.toUTCString()}; HttpOnly; Secure; SameSite=Lax`;

    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirect') || '/login'; // Redirect to login page by default

    return new Response('Logged out', {
        status: 302,
        headers: {
            'Set-Cookie': cookie,
            'Location': redirectUrl,
        },
    });
}


export default {
    async fetch(request, env) {
        // Check essential environment variables
        const requiredEnvVars = [
            'DATA_KV', 'GEMINI_API_KEY', 'GEMINI_API_URL', 'DEFAULT_GEMINI_MODEL', 'OPEN_TRANSLATE', 'USE_MODEL_PLATFORM',
            'GITHUB_TOKEN', 'GITHUB_REPO_OWNER', 'GITHUB_REPO_NAME','GITHUB_BRANCH',
            'LOGIN_USERNAME', 'LOGIN_PASSWORD',
            'PODCAST_TITLE','PODCAST_BEGIN','PODCAST_END',
            'FOLO_COOKIE_KV_KEY','FOLO_DATA_API','FOLO_FILTER_DAYS',
            'AIBASE_FEED_ID', 'XIAOHU_FEED_ID', 'HGPAPERS_FEED_ID', 'TWITTER_LIST_ID',
            'AIBASE_FETCH_PAGES', 'XIAOHU_FETCH_PAGES', 'HGPAPERS_FETCH_PAGES', 'TWITTER_FETCH_PAGES',
            //'AIBASE_API_URL', 'XIAOHU_API_URL','PROJECTS_API_URL','HGPAPERS_API_URL', 'TWITTER_API_URL', 'TWITTER_USERNAMES',
        ];
        console.log(env);
        const missingVars = requiredEnvVars.filter(varName => !env[varName]);

        if (missingVars.length > 0) {
            console.error(`CRITICAL: Missing environment variables/bindings: ${missingVars.join(', ')}`);
            const errorPage = `
                <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Configuration Error</title></head>
                <body style="font-family: sans-serif; padding: 20px;"><h1>Server Configuration Error</h1>
                <p>Essential environment variables or bindings are missing: ${missingVars.join(', ')}. The service cannot operate.</p>
                <p>Please contact the administrator.</p></body></html>`;
            return new Response(errorPage, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        
        const url = new URL(request.url);
        const path = url.pathname;
        console.log(`Request received: ${request.method} ${path}`);

        // Handle login path specifically
        if (path === '/login') {
            return await handleLogin(request, env);
        } else if (path === '/logout') { // Handle logout path
            return await handleLogout(request);
        }

        // Authentication check for all other paths
        const authenticated = await isAuthenticated(request, env);
        if (!authenticated) {
            // Redirect to login page, passing the original URL as a redirect parameter
            const loginUrl = new URL('/login', url.origin);
            loginUrl.searchParams.set('redirect', url.pathname + url.search);
            return Response.redirect(loginUrl.toString(), 302);
        }

        // Original routing logic for authenticated requests
        try {
            if (path === '/writeData' && request.method === 'POST') {
                return await handleWriteData(request, env);
            } else if (path === '/getContent' && request.method === 'GET') {
                return await handleGetContent(request, env);
            } else if (path === '/getContentHtml' && request.method === 'GET') {
                // Prepare dataCategories for the HTML generation
                const dataCategories = Object.keys(dataSources).map(key => ({
                    id: key,
                    name: dataSources[key].name
                }));
                return await handleGetContentHtml(request, env, dataCategories);
            } else if (path === '/genAIContent' && request.method === 'POST') {
                return await handleGenAIContent(request, env);
            } else if (path === '/commitToGitHub' && request.method === 'POST') {
                return await handleCommitToGitHub(request, env);
            } else if (path === '/setFoloCookie' && request.method === 'POST') {
                try {
                    const formData = await request.formData();
                    const foloCookie = formData.get('foloCookie');
                    console.log('Received Folo Cookie:', foloCookie);
                    if (foloCookie) {
                        await env.DATA_KV.put(env.FOLO_COOKIE_KV_KEY , foloCookie);
                        return new Response('Folo Cookie saved successfully!', { status: 200 });
                    } else {
                        return new Response('No Folo Cookie provided.', { status: 400 });
                    }
                } catch (error) {
                    console.error('Error setting Folo Cookie:', error);
                    return new Response(`Error setting Folo Cookie: ${error.message}`, { status: 500 });
                }
            }
            else {
                // const availableEndpoints = [
                //     "/writeData (POST) - Fetches, filters, translates, and stores data for today.",
                //     "/getContent?date=YYYY-MM-DD (GET) - Retrieves stored data as JSON.",
                //     "/getContentHtml?date=YYYY-MM-DD (GET) - Displays stored data as HTML with selection.",
                //     "/genAIContent (POST) - Generates summary from selected items. Expects 'date' and 'selectedItems' form data.",
                //     "/commitToGitHub (POST) - Commits generated content to GitHub. Triggered from /genAIContent result page.",
                //     "/logout (GET) - Clears the login cookie and redirects."
                // ];
                // let responseBody = `Not Found. Available endpoints:\n\n${availableEndpoints.map(ep => `- ${ep}`).join('\n')}\n\nSpecify a date parameter (e.g., ?date=2023-10-27) for content endpoints or they will default to today.`;
                // return new Response(responseBody, { status: 404, headers: {'Content-Type': 'text/plain; charset=utf-8'} });
                return new Response(null, { status: 404, headers: {'Content-Type': 'text/plain; charset=utf-8'} });
            }
        } catch (e) {
            console.error("Unhandled error in fetch handler:", e);
            return new Response(`Internal Server Error: ${e.message}`, { status: 500 });
        }
    }
};
