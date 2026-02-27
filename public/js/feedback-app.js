import { FeedbackForm } from './components/FeedbackForm.js';
import { FeedbackList } from './components/FeedbackList.js';

const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect } = React || {};

function FeedbackApp() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('feedbacks');
        if (data) {
            try {
                setFeedbacks(JSON.parse(data));
            } catch (e) {
                console.error('Ошибка загрузки отзывов:', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    }, [feedbacks]);

    const handleSubmit = (formData) => {
        const newFeedback = {
            id: editId || Date.now(),
            name: formData.name.trim(),
            email: formData.email.trim(),
            comment: formData.comment.trim(),
            rating: formData.rating,
            date: new Date().toLocaleDateString('ru-RU')
        };

        if (editId) {
            setFeedbacks(prev => 
                prev.map(fb => fb.id === editId ? newFeedback : fb)
            );
            setEditId(null);
        } else {
            setFeedbacks(prev => [...prev, newFeedback]);
        }
    };

    const handleEdit = (feedback) => {
        setEditId(feedback.id);
    };

    const handleCancelEdit = () => {
        setEditId(null);
    };

    const handleDelete = (id) => {
        setFeedbacks(prev => prev.filter(fb => fb.id !== id));
    };

    const editData = editId ? feedbacks.find(fb => fb.id === editId) : null;

    return React.createElement(React.Fragment, null,
        React.createElement('section', { className: 'feedback-section' },
            React.createElement('h2', null, 'Обратная связь'),
            React.createElement('p', null, 'Мы ценим ваше мнение! Поделитесь своими впечатлениями о нашем сервисе или задайте вопрос.'),
            React.createElement(FeedbackForm, {
                onSubmit: handleSubmit,
                editData: editData,
                onCancelEdit: handleCancelEdit
            })
        ),
        React.createElement('section', { className: 'feedback-list-section' },
            React.createElement('h2', null, 'Отзывы пользователей'),
            React.createElement(FeedbackList, {
                feedbacks: feedbacks,
                onEdit: handleEdit,
                onDelete: handleDelete
            })
        )
    );
}

const rootEl = document.getElementById('feedback-root');
if (!React || !ReactDOM) {
    console.error('React/ReactDOM не загружены. Убедитесь, что CDN-скрипты подключены выше entry-модулей.');
} else if (!rootEl) {
    console.error('Элемент feedback-root не найден!');
} else {
    const reactRoot = ReactDOM.createRoot(rootEl);
    reactRoot.render(React.createElement(FeedbackApp));
}
