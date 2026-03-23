// экспорт функции для вставки стилей
export function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 24px;
        }
        h2 {
            margin-top: 0;
            color: #1e3a5f;
            font-weight: 500;
        }
        .description {
            background: #e3f2fd;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-size: 1rem;
            color: #0d3b66;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            font-weight: 500;
            margin-bottom: 6px;
            color: #333;
        }
        input, select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            transition: border 0.2s;
        }
        input:focus, select:focus {
            border-color: #1e3a5f;
            outline: none;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .checkbox-group input {
            width: auto;
            margin-right: 8px;
        }
        .button-group {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 24px;
            flex-wrap: wrap;
        }
        button {
            background: #1e3a5f;
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 40px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #15324b;
        }
        .hint {
            color: #666;
            font-style: italic;
        }
        .result-card {
            background: #f9f9f9;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .probability {
            font-size: 2rem;
            font-weight: 700;
            color: #1e3a5f;
        }
        .verdict {
            font-size: 1.2rem;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
            margin: 8px 0;
        }
        .verdict.approved { background: #c8e6c9; color: #1e5f2e; }
        .verdict.maybe { background: #fff3cd; color: #856404; }
        .verdict.denied { background: #f8d7da; color: #721c24; }
        .reason {
            margin: 12px 0;
            padding: 10px;
            background: #fff3e0;
            border-radius: 8px;
        }
        .offers {
            margin-top: 24px;
        }
        .offer-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .back-button {
            background: transparent;
            color: #1e3a5f;
            border: 1px solid #1e3a5f;
            margin-top: 16px;
        }
        .back-button:hover {
            background: #e3f2fd;
        }
        .hidden {
            display: none;
        }
        .form-screen {
            max-width: 600px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);
}