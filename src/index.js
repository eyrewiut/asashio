require('dotenv').config();
const polka = require('polka');
const send = require('@polka/send-type');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const compression = require('compression');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cookie = require('cookie');
const JWT = require('jsonwebtoken');
const logger = require('./logger');

const server = polka()
	.use(cors({
		origin: process.env.CORS_ORIGINS.split(','),
		credentials: true,
		allowedHeaders: ['Accept', 'Content-Type'],
		optionsSuccessStatus: 200
	}))
	.use(helmet())
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }))
	.use(compression())
	.use((_, res, next) => {
		res.send = (code, data, headers) => send(res, code, data, headers);
		res.redirect = redirect => {
			res.writeHead(302, { location: redirect });
			res.end();
		};
		res.append = (header, value) => {
			const prev = res.getHeader(header);
			if (prev) {
				value = Array.isArray(prev) ? prev.concat(value) : [prev].concat(value);
			}
			res.setHeader(header, value);
		};
		res.cookie = (name, data, options) => {
			const value = cookie.serialize(name, data, options);
			res.append('Set-Cookie', value);
		};
		next();
	})
	.get('/', (_, res) => res.send(200, { message: 'Asashio!' }))
	.get('/discord', (_, res) => res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.DISCORD_CALLBACK_DOMAIN}${process.env.DISCORD_CALLBACK_PORT}${process.env.DISCORD_CALLBACK_ROUTE}`)}&response_type=code&scope=${process.env.DISCORD_SCOPES.split(',').join('%20')}`))
	.get('/discord/callback', async (req, res) => {
		const accessCode = req.query.code;
		if (!accessCode) return res.send(400, { message: 'No access code provided.' });

		const data = new FormData();
		data.append('client_id', process.env.DISCORD_CLIENT_ID);
		data.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
		data.append('grant_type', 'authorization_code');
		data.append('redirect_uri', `${process.env.DISCORD_CALLBACK_DOMAIN}${process.env.DISCORD_CALLBACK_PORT}${process.env.DISCORD_CALLBACK_ROUTE}`);
		data.append('scope', process.env.DISCORD_SCOPES.split(',').join(' '));
		data.append('code', accessCode);

		const response = await (await fetch('https://discordapp.com/api/oauth2/token', {
			method: 'POST',
			body: data
		})).json();

		const resp = await (await fetch('https://discordapp.com/api/users/@me', {
			headers: {
				authorization: `${response.token_type} ${response.access_token}`
			}
		})).json();

		res.cookie(
			'token',
			JWT.sign({ access_token: response.access_token, user: resp }, process.env.JWT_SECRET, { expiresIn: '7d' }),
			{ path: '/', httpOnly: true, maxAge: 6e8 / 1000, secure: Boolean(process.env.NODE_ENV === 'production') }
		);

		return res.send(200, { message: 'Yay!', user: resp });
	});

server.listen(process.env.PORT, () => logger.info(`> Running on localhost:${process.env.PORT}`));

module.exports = server;
