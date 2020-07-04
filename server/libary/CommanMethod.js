/*
 * v1
 * auth pankaj vashisht @sharmapankaj688@gmail.com
 * helper can used in the whole app for sending mail , push  , payment etc work.
 * function with anysc , await or without anysc awit .
 */

/**
 * first import the configration file after get the all configration
 * send mail , push , file upload etc .
 * when function cal then that file import at moment.
 */
const { config, mails, SMS, lang } = require('../config');
const fs = require('fs');
const crypto = require('crypto');
const twilio = require('twilio');
const apn = require('apn');
const { MailClient } = require('./mails');
module.exports = {
	send_mail: function (object) {
		const Sendmails = new MailClient(mails[mails.default]);
		Sendmails.to(object.to)
			.subject(object.subject)
			.html(object.template, object.data)
			.send();
	},
	mailgun: function () {},
	upload_pic_with_await: function (
		file,
		folder_name = 'uploads/',
		unlink = null
	) {
		try {
			if (!file) {
				return false; // if not getting the image
			} else {
				if (unlink) {
					//
				}

				let upload_path = appRoot + '/public/' + folder_name;
				let image = file;
				let image_array = image.mimetype.split('/');
				let extension = image_array[image_array.length - 1];
				var timestamp = parseInt(new Date().getTime());
				image.mv(upload_path + '/' + timestamp + '.' + extension, function (
					err
				) {
					if (err) {
						// eslint-disable-next-line no-console
						console.log(err);
					} else {
						// eslint-disable-next-line no-console
						console.log('file_uploaded');
					}
				});
				return timestamp + '.' + extension;
			}
		} catch (err) {
			throw { code: 415, message: err };
		}
	},
	send_push: function (data) {
		const { FCM } = require('push-notification-node');
		const GOOGLE_KEY = config.GOOGLE_KEY; //put your server key here
		console.log(GOOGLE_KEY);
		const fcm = new FCM(GOOGLE_KEY);
		const body = {
			body: data.message,
			title: config.App_name,
			notificationCode: 1,
			data,
		};
		console.log(body);
		fcm
			.sendPromise(data.token, body)
			.then((res) => {
				console.log(res);
			})
			.catch((err) => {
				console.log(err);
			});
	},
	sendPushApn: (pushData) => {
		try {
			const options = {
				token: {
					key: `${config.rootPath}/apn.p8`,
					keyId: process.env.APNKEYID,
					teamId: 'developer-team-id',
				},
				production: false,
			};
			const apnProvider = new apn.Provider(options);
			const note = new apn.Notification();
			note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
			note.badge = 1;
			note.sound = 'ping.aiff';
			note.alert = `\uD83D\uDCE7 \u2709 ${pushData.message}`;
			note.payload = pushData;
			apnProvider.send(note, pushData.token).then((result) => {
				console.log('apn success', result);
			});
		} catch (error) {
			console.log('apn error', error);
		}
	},
	paypal: async function () {},
	stripe: async function () {},
	brain_tree: async function () {},
	sendSMS: (data) => {
		const { accountSid, authToken, sendNumber } = SMS[SMS.default];
		const client = new twilio(accountSid, authToken);
		client.messages
			.create({
				body: data.message,
				to: '+' + data.to, // Text this number
				from: sendNumber, // From a valid Twilio number
			})
			.then((message) => console.log(message.sid))
			.catch((err) => {
				console.log(err);
			});
	},
	error: function (res, err) {
		try {
			let code =
				typeof err === 'object'
					? err.hasOwnProperty('code')
						? err.code
						: 500
					: 403;
			let message =
				typeof err === 'object'
					? err.hasOwnProperty('message')
						? err.message
						: err
					: err;
			res.status(code).json({
				success: false,
				error_message: message,
				code: code,
				data: [],
			});
		} catch (error) {
			res.status(500).json(error);
		}
	},
	success: function (res, data) {
		res.json({
			success: true,
			message: data.message,
			code: 200,
			data: data.data,
		});
	},
	loadModel: function (file_name = null) {
		try {
			if (fs.existsSync(config.rootPath + 'model/' + file_name + '.js')) {
				let models = require('../model/' + file_name);
				return new models();
			} else {
				let message =
					'Model ' +
					file_name +
					' Not Found on the server.Please create the ' +
					file_name +
					' in model folder.';
				throw { code: 404, message };
			}
		} catch (err) {
			throw err;
		}
	},

	createToken() {
		const key = 'abc' + new Date().getTime();
		return crypto.createHash('sha1').update(key).digest('hex');
	},
	addUrl(data, key, folder = 'uploads') {
		if (data.length === 0) {
			return [];
		}
		return data.map((element) => {
			if (!Array.isArray(key)) {
				if (element[key].length > 0) {
					element[key] = appURL + folder + '/' + element[key];
				}
			} else {
				for (const names of key) {
					if (element[names].length > 0) {
						element[names] = appURL + folder + '/' + element[names];
					}
				}
			}
			return element;
		});
	},
	createHash(key, hash = 'sha1') {
		return crypto.createHash(hash).update(key).digest('hex');
	},
	UserToken: function (id, req) {
		const clientIp = req.connection.remoteAddress;
		const {
			isMobile,
			isDesktop,
			browser,
			version,
			os,
			platform,
			source,
		} = req.useragent;
		let token =
			id +
			clientIp +
			isMobile +
			isDesktop +
			os +
			version +
			platform +
			source +
			browser;
		return this.createHash(token);
	},
	ImageUrl(name, folder = 'uploads') {
		return appURL + folder + '/' + name;
	},
	randomNumber() {
		return Math.floor(1000 + Math.random() * 9000);
	},
	get currentTime() {
		return Math.round(new Date().getTime() / 1000, 0);
	},
	UnixTimeStamp(date) {
		return Math.round(new Date(date).getTime() / 1000, 0);
	},
	Message(message) {
		return lang[_Lang][message] || 'something batter';
	},
	get currentMonthFirstDate() {
		const date = new Date();
		return Math.round(
			new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000,
			0
		);
	},
	get currentWeekFirstDate() {
		const date = new Date();
		var day = date.getDay(),
			diff = date.getDate() - day + (day == 0 ? -6 : 1);
		return Math.round(new Date(d.setDate(diff)).getTime() / 1000, 0);
	},
};
