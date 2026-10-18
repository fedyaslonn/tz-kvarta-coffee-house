'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { COMMENT_LIMIT, FORM_TIMEOUT_MS, composeComment, formatBelarusPhone, parseLeadResult, validateFields, type FieldErrors, type LeadFields } from '@/lib/lead-form';
import type { Interest } from '@/lib/content';
import { useOrder } from './order-context';
import styles from './lead-form.module.css';

const fieldNames = ['name', 'phone', 'interest', 'comment'];
const subscribe = () => () => undefined;

export function LeadForm() {
  // Do not accept input before React can retain it (especially on slow in-app browsers).
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const { selection, choose, clearProduct, attribution, pending, setPending } = useOrder();
  const [fields, setFields] = useState({ name: '', phone: '', comment: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const commentLength = composeComment(fields.comment, selection.product).length;

  useEffect(() => {
    if (!Object.keys(errors).length) return;
    const first = fieldNames.find(field => errors[field]);
    const target = first ? formRef.current?.elements.namedItem(first) : document.getElementById('form-errors');
    if (target instanceof HTMLElement) target.focus();
  }, [errors]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setMessage('');
    const data: LeadFields = { ...fields, interest: selection.interest };
    const invalid = validateFields(data, selection.product);
    if (Object.keys(invalid).length) { setErrors(invalid); return; }
    submitting.current = true;
    setPending(true);
    setErrors({});
    try {
      const response = await fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(FORM_TIMEOUT_MS),
        body: JSON.stringify({ ...data, comment: composeComment(data.comment, selection.product), ...attribution.current }),
      });
      const value: unknown = await response.json();
      const result = parseLeadResult(value, response.status);
      if (result.ok) {
        setMessage(result.duplicate
          ? 'Заявка с этим номером уже у нас. Мы свяжемся с вами — ещё раз отправлять не нужно.'
          : 'Спасибо! Заявка у нас. Перезвоним, поможем с выбором и договоримся о доставке.');
      } else setErrors(result.errors);
    } catch (error) {
      const timedOut = error instanceof DOMException && ['TimeoutError', 'AbortError'].includes(error.name);
      setErrors({ _form: timedOut
        ? 'Ответ задерживается. Попробуйте отправить ещё раз — повторная заявка не создаст дубль. Ваши данные остались в форме.'
        : 'Не удалось подтвердить отправку. Проверьте интернет и попробуйте ещё раз. Ваши данные остались в форме.' });
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  function error(name: string) {
    return errors[name] ? <p className={styles.error} id={`${name}-error`}>{errors[name]}</p> : null;
  }

  return <form id="lead-form" method="post" action="/api/lead" ref={formRef} tabIndex={-1} onSubmit={submit} noValidate aria-busy={pending} className={styles.form}>
    <fieldset disabled={pending || !hydrated} className={styles.fields}>
      <legend className="sr-only">Заявка в обжарку «Кварта»</legend>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="name">Ваше имя</label>
          <input id="name" name="name" required minLength={2} maxLength={60} autoComplete="name" placeholder="Как к вам обращаться"
            value={fields.name} onChange={event => setFields({ ...fields, name: event.target.value })}
            aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
          {error('name')}
        </div>
        <div className={styles.field}>
          <label htmlFor="phone">Телефон</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" required maxLength={40} autoComplete="tel" placeholder="+375 (29) 123-45-67"
            value={fields.phone} onChange={event => setFields({ ...fields, phone: event.target.value })}
            onBlur={() => setFields(previous => ({ ...previous, phone: formatBelarusPhone(previous.phone) }))}
            aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-hint phone-error' : 'phone-hint'} />
          <p id="phone-hint" className={styles.hint}>Белорусский мобильный или городской с кодом. Полный номер оформим как +375 (29) 123-45-67.</p>
          {error('phone')}
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="interest">Что вас интересует</label>
        <select id="interest" name="interest" required value={selection.interest}
          onChange={event => choose({ interest: event.target.value as Interest })}
          aria-invalid={!!errors.interest} aria-describedby={errors.interest ? 'interest-error' : undefined}>
          <option value="subscription">Подписка на кофе</option>
          <option value="order">Разовый заказ</option>
          <option value="question">Хочу задать вопрос</option>
        </select>
        {error('interest')}
      </div>
      {selection.product && <div className={styles.selected}>
        <span><span className={styles.hint}>Ваш выбор</span><br />{selection.product}</span>
        <button type="button" onClick={clearProduct} className={styles.remove} aria-label="Убрать выбранный кофе">Убрать <span aria-hidden="true">×</span></button>
      </div>}
      <div className={styles.field}>
        <label htmlFor="comment">Комментарий <span className={styles.optional}>если хочется</span></label>
        <textarea id="comment" name="comment" rows={3} maxLength={COMMENT_LIMIT} placeholder="Например, как вы готовите кофе или когда удобно позвонить"
          value={fields.comment} onChange={event => setFields({ ...fields, comment: event.target.value })}
          aria-invalid={!!errors.comment} aria-describedby={errors.comment ? 'comment-count comment-error' : 'comment-count'} />
        <span id="comment-count" className={`${styles.hint} ${commentLength > COMMENT_LIMIT ? styles.error : ''}`}>{commentLength} / {COMMENT_LIMIT} — вместе с выбранным кофе</span>
        {error('comment')}
      </div>
      <button type="submit" className={styles.submit} disabled={pending || !hydrated}>{pending ? 'Отправляем…' : 'Жду звонка'} <span aria-hidden="true">↗</span></button>
    </fieldset>
    <p className={styles.hint}>Используем номер, чтобы связаться с вами по заявке.</p>
    <div id="form-errors" tabIndex={-1} role="alert" className={styles.feedback}>
      {Object.entries(errors).filter(([key]) => !fieldNames.includes(key)).map(([key, value]) => <p className={styles.error} key={key}>{value}</p>)}
    </div>
    <p role="status" className={`${styles.feedback} ${styles.success}`}>{message}</p>
  </form>;
}
