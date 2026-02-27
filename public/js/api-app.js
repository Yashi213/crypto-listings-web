import { ApiComments } from './components/ApiComments.js';

const React = window.React;
const ReactDOM = window.ReactDOM;

const rootEl = document.getElementById('api-comments-root');
if (!React || !ReactDOM) {
    console.error('React/ReactDOM не загружены. Убедитесь, что CDN-скрипты подключены выше entry-модулей.');
} else if (!rootEl) {
    console.error('Элемент api-comments-root не найден!');
} else {
    const reactRoot = ReactDOM.createRoot(rootEl);
    reactRoot.render(React.createElement(ApiComments));
}
