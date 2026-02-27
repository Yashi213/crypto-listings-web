let ApiComments;
let CommentItem;

if (typeof window.React === 'undefined') {
    console.error('ApiComments: React не загружен! Компонент не будет работать.');
    ApiComments = function ApiComments() { return null; };
    CommentItem = function CommentItem() { return null; };
} else {
    const React = window.React;
    const { useState, useEffect } = React;

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

class ApiError extends Error {
    constructor(message, type) {
        super(message);
        this.type = type;
    }
}

async function fetchComments(postId) {
    const url = `${API_BASE_URL}/comments?postId=${postId}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new ApiError('Запрашиваемый ресурс не найден', 'not_found');
            }
            throw new ApiError(`Ошибка сервера: ${response.status}`, 'server_error');
        }
        
        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new ApiError('Нет подключения к сети. Проверьте интернет-соединение.', 'network_error');
        }
        throw new ApiError('API недоступен. Попробуйте позже.', 'api_unavailable');
    }
}

    CommentItem = function CommentItem({ comment }) {
    return React.createElement('article', { className: 'api-comment' },
        React.createElement('div', { className: 'api-comment__header' },
            React.createElement('h4', { className: 'api-comment__name' }, comment.name),
            React.createElement('span', { className: 'api-comment__email' }, comment.email)
        ),
        React.createElement('p', { className: 'api-comment__body' }, comment.body)
    );
};

    ApiComments = function ApiComments() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [postId, setPostId] = useState(null);

    const loadComments = async () => {
        const randomPostId = Math.floor(Math.random() * 100) + 1;
        setPostId(randomPostId);
        setLoading(true);
        setError(null);
        setComments([]);

        try {
            const data = await fetchComments(randomPostId);
            setComments(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, []);

    const getErrorMessage = () => {
        if (!error) return '';
        
        const errorMessages = {
            'network_error': '🌐 Ошибка сети: ' + error.message,
            'api_unavailable': '⚠️ API недоступен: ' + error.message,
            'not_found': '🔍 Не найдено: ' + error.message,
            'server_error': '🔥 Ошибка сервера: ' + error.message
        };
        
        return errorMessages[error.type] || error.message;
    };

    return React.createElement('section', { className: 'api-comments-section' },
        React.createElement('h2', null, 'Комментарии из API'),
        React.createElement('p', { className: 'api-comments-info' },
            'Данные загружаются с JSONPlaceholder API. Текущий фильтр: ',
            React.createElement('span', { id: 'currentPostId' },
                postId ? `Пост #${postId}` : '—'
            )
        ),
        React.createElement('button', {
            type: 'button',
            className: 'btn-load-comments',
            onClick: loadComments,
            disabled: loading
        }, loading ? 'Загрузка...' : 'Загрузить комментарии'),
        loading && React.createElement('div', { className: 'comments-loader' },
            React.createElement('div', { className: 'loader-spinner' }),
            React.createElement('p', null, 'Загрузка комментариев...')
        ),
        error && !loading && React.createElement('div', { className: 'comments-error' },
            React.createElement('p', null, getErrorMessage()),
            React.createElement('button', {
                type: 'button',
                className: 'btn-retry',
                onClick: loadComments
            }, 'Попробовать снова')
        ),
        !loading && !error && React.createElement('div', { className: 'comments-container' },
            comments.length === 0
                ? React.createElement('p', { className: 'no-comments' }, 'Комментарии не найдены')
                : comments.map(comment =>
                    React.createElement(CommentItem, { key: comment.id, comment: comment })
                )
        )
    );
    };
}

export { ApiComments, CommentItem };
