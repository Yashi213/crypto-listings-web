let FeedbackItem;
let FeedbackList;

if (typeof window.React === 'undefined') {
    console.error('FeedbackList: React не загружен! Компонент не будет работать.');
    FeedbackList = function FeedbackList() { return null; };
    FeedbackItem = function FeedbackItem() { return null; };
} else {
    const React = window.React;

    FeedbackItem = function FeedbackItem({ feedback, onEdit, onDelete }) {
    return React.createElement('article', { className: 'feedback-item' },
        React.createElement('div', { className: 'feedback-item__header' },
            React.createElement('h3', { className: 'feedback-item__name' }, feedback.name),
            React.createElement('div', { className: 'feedback-item__meta' },
                React.createElement('span', { className: 'feedback-item__email' }, feedback.email),
                React.createElement('span', { className: 'feedback-item__date' }, feedback.date),
                feedback.rating && React.createElement('span', { className: 'feedback-item__rating' },
                    '★'.repeat(parseInt(feedback.rating))
                )
            )
        ),
        React.createElement('p', { className: 'feedback-item__comment' }, feedback.comment),
        React.createElement('div', { className: 'feedback-item__actions' },
            React.createElement('button', {
                type: 'button',
                className: 'feedback-item__edit-btn',
                onClick: () => onEdit(feedback)
            }, 'Редактировать'),
            React.createElement('button', {
                type: 'button',
                className: 'feedback-item__delete-btn',
                onClick: () => {
                    if (confirm('Удалить отзыв?')) {
                        onDelete(feedback.id);
                    }
                }
            }, 'Удалить')
        )
    );
};

    FeedbackList = function FeedbackList({ feedbacks, onEdit, onDelete }) {
    if (feedbacks.length === 0) {
        return React.createElement('div', { className: 'feedback-list' },
            React.createElement('p', {
                style: { textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }
            }, 'Пока нет отзывов. Будьте первым!')
        );
    }

    return React.createElement('div', { className: 'feedback-list' },
        feedbacks.map(feedback =>
            React.createElement(FeedbackItem, {
                key: feedback.id,
                feedback: feedback,
                onEdit: onEdit,
                onDelete: onDelete
            })
        )
    );
    };
}

export { FeedbackList, FeedbackItem };
