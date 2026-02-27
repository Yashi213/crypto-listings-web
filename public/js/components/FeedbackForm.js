let FeedbackForm;

if (typeof window.React === 'undefined') {
    console.error('FeedbackForm: React не загружен! Компонент не будет работать.');
    FeedbackForm = function FeedbackForm() { return null; };
} else {
    const React = window.React;
    const { useState, useEffect } = React;

    FeedbackForm = function FeedbackForm({ onSubmit, editData, onCancelEdit }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        comment: '',
        rating: ''
    });

    const [errors, setErrors] = useState({
        name: '',
        email: '',
        comment: ''
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                email: editData.email || '',
                comment: editData.comment || '',
                rating: editData.rating || ''
            });
        } else {
            setFormData({ name: '', email: '', comment: '', rating: '' });
        }
        setErrors({ name: '', email: '', comment: '' });
    }, [editData]);

    const validate = () => {
        const newErrors = { name: '', email: '', comment: '' };
        let isValid = true;

        if (formData.name.trim().length < 3) {
            newErrors.name = 'Минимум 3 символа';
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Введите корректный email';
            isValid = false;
        }

        if (formData.comment.trim().length < 10) {
            newErrors.comment = 'Минимум 10 символов';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
            if (!editData) {
                setFormData({ name: '', email: '', comment: '', rating: '' });
            }
        }
    };

    return React.createElement('form', {
        className: 'feedback-form',
        onSubmit: handleSubmit,
        noValidate: true
    },
        React.createElement('fieldset', { className: 'form__fieldset' },
            React.createElement('legend', { className: 'form__legend' },
                editData ? 'Редактировать отзыв' : 'Заполните форму обратной связи'
            ),
            React.createElement('div', { className: 'form__group' },
                React.createElement('label', { htmlFor: 'fullName', className: 'form__label-text' },
                    'ФИО ',
                    React.createElement('span', { className: 'form__required' }, '*')
                ),
                React.createElement('input', {
                    type: 'text',
                    id: 'fullName',
                    name: 'name',
                    className: 'form__input',
                    value: formData.name,
                    onChange: handleChange,
                    required: true,
                    minLength: 3,
                    maxLength: 100,
                    pattern: '[А-Яа-яЁёA-Za-z\\s]{3,}',
                    placeholder: 'Иванов Иван Иванович'
                }),
                errors.name && React.createElement('span', { className: 'form__error' }, errors.name)
            ),
            React.createElement('div', { className: 'form__group' },
                React.createElement('label', { htmlFor: 'email', className: 'form__label-text' },
                    'Email ',
                    React.createElement('span', { className: 'form__required' }, '*')
                ),
                React.createElement('input', {
                    type: 'email',
                    id: 'email',
                    name: 'email',
                    className: 'form__input',
                    value: formData.email,
                    onChange: handleChange,
                    required: true,
                    placeholder: 'example@mail.com'
                }),
                errors.email && React.createElement('span', { className: 'form__error' }, errors.email)
            ),
            React.createElement('div', { className: 'form__group' },
                React.createElement('label', { htmlFor: 'comment', className: 'form__label-text' },
                    'Комментарий ',
                    React.createElement('span', { className: 'form__required' }, '*')
                ),
                React.createElement('textarea', {
                    id: 'comment',
                    name: 'comment',
                    className: 'form__textarea',
                    value: formData.comment,
                    onChange: handleChange,
                    required: true,
                    minLength: 10,
                    maxLength: 1000,
                    rows: 5,
                    placeholder: 'Ваш отзыв или вопрос...'
                }),
                errors.comment && React.createElement('span', { className: 'form__error' }, errors.comment)
            ),
            React.createElement('div', { className: 'form__group' },
                React.createElement('label', { htmlFor: 'rating', className: 'form__label-text' }, 'Оценка'),
                React.createElement('select', {
                    id: 'rating',
                    name: 'rating',
                    className: 'form__select',
                    value: formData.rating,
                    onChange: handleChange
                },
                    React.createElement('option', { value: '' }, 'Выберите оценку'),
                    React.createElement('option', { value: '5' }, 'Отлично (5)'),
                    React.createElement('option', { value: '4' }, 'Хорошо (4)'),
                    React.createElement('option', { value: '3' }, 'Удовлетворительно (3)'),
                    React.createElement('option', { value: '2' }, 'Плохо (2)'),
                    React.createElement('option', { value: '1' }, 'Очень плохо (1)')
                )
            ),
            React.createElement('div', { style: { display: 'flex', gap: '1rem' } },
                React.createElement('button', {
                    type: 'submit',
                    className: 'form__submit'
                }, editData ? 'Сохранить' : 'Отправить отзыв'),
                editData && React.createElement('button', {
                    type: 'button',
                    className: 'form__submit',
                    onClick: onCancelEdit,
                    style: { background: 'var(--text-light)' }
                }, 'Отмена')
            )
        )
    );
    };
}

export { FeedbackForm };
