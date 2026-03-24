import axios from 'axios';
import nodemailer from 'nodemailer';

function isSmtpConfigured(): boolean {
	return Boolean(
		process.env.SMTP_HOST &&
			process.env.SMTP_USER &&
			process.env.SMTP_PASS,
	);
}

/**
 * Отправка кода подтверждения email.
 * Без SMTP (dev) — код пишется в консоль сервера.
 */
export async function sendEmailVerificationCode(
	to: string,
	code: string,
): Promise<void> {
	const subject = 'БиоЛаб — код подтверждения';
	const text = `Ваш код подтверждения: ${code}\n\nКод действителен 15 минут.\nЕсли вы не регистрировались в БиоЛаб, проигнорируйте это письмо.`;

	// На практике SMTP может не работать из-за сети/блокировок.
	// Поэтому код всегда логируем, чтобы верификация была возможна даже в dev.
	console.log(
		`\n📧 Код подтверждения (dev-log)\n   Кому: ${to}\n   Код: ${code}\n`,
	);

	// 1) Сначала пробуем отправить через Brevo (HTTP API, 443)
	// Это обычно проще/надёжнее в сетях, где закрыты SMTP порты.
	if (process.env.BREVO_API_KEY) {
		try {
			const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;
			const senderName = process.env.BREVO_SENDER_NAME || 'БиоЛаб';

			if (!senderEmail) {
				throw new Error(
					'BREVO_SENDER_EMAIL не задан (или SMTP_USER не задан).',
				);
			}

			await axios.post(
				'https://api.brevo.com/v3/smtp/email',
				{
					sender: { email: senderEmail, name: senderName },
					to: [{ email: to }],
					subject: 'БиоЛаб — код подтверждения',
					'htmlContent': `<p>Ваш код подтверждения:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>Код действителен <strong>15 минут</strong>.</p>`,
					textContent: `Ваш код подтверждения: ${code}\n\nКод действителен 15 минут.`,
				},
				{
					headers: {
						'api-key': process.env.BREVO_API_KEY,
						'Content-Type': 'application/json',
					},
				},
			);

			console.log(`📧 Код подтверждения отправлен через Brevo на ${to}`);
			return;
		} catch (err) {
			console.error('❌ Brevo send failed:', err);
			// продолжаем пробовать SMTP, если он настроен
		}
	}

	if (!isSmtpConfigured()) {
		console.log(
			`\n📧 [email: SMTP не настроен — код только в логе]\n   Кому: ${to}\n   Код: ${code}\n`,
		);
		return;
	}

	const port = Number(process.env.SMTP_PORT || 587);
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port,
		secure: process.env.SMTP_SECURE === 'true' || port === 465,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const from = process.env.SMTP_FROM || process.env.SMTP_USER;

	try {
		await transporter.sendMail({
			from,
			to,
			subject,
			text,
			html: `<p>Ваш код подтверждения:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>Код действителен <strong>15 минут</strong>.</p>`,
		});

		console.log(`📧 Код подтверждения отправлен на ${to}`);
	} catch (err) {
		// Чтобы регистрация не ломалась из-за сетевых/SMTP проблем,
		// в dev-режиме выводим код в консоль.
		console.error('❌ SMTP sendMail failed:', err);
		console.log(`📧 [email: отправка не удалась — код уже выведен выше]`);
	}
}
