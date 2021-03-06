const ApiController = require('./ApiController');
const app = require('../../../libary/CommanMethod');
const Db = require('../../../libary/sqlBulider');
const ApiError = require('../../Exceptions/ApiError');
const { lang } = require('../../../config');
const PaymentController = require('./PaymentController');
const DB = new Db();
class UserController extends ApiController {
	constructor() {
		super();
		this.addUser = this.addUser.bind(this);
		this.loginUser = this.loginUser.bind(this);
		this.checkEmail = this.checkEmail.bind(this);
	}

	async addUser(Request) {
		const { RequestData } = Request;
		if (Request.files && Request.files.profile) {
			RequestData.profile = await app.upload_pic_with_await(
				Request.files.profile
			);
		}
		if (Request.files && Request.files.licence) {
			RequestData.licence = await app.upload_pic_with_await(
				Request.files.licence
			);
		}
		const user_id = await DB.save('users', RequestData);
		RequestData.lang = Request.lang;
		setTimeout(() => {
			paymentRegister(RequestData, user_id);
			this.mails(RequestData);
		}, 0);
		const usersInfo = await super.userDetails(user_id);
		if (usersInfo.profile.length > 0) {
			usersInfo.profile = appURL + 'uploads/' + usersInfo.profile;
		}
		return {
			message: app.Message('signup'),
			data: usersInfo,
		};
	}
	async checkEmail(Request) {
		const required = {
			type: Request.body.type,
			value: Request.body.value,
		};
		const RequestData = await super.vaildation(required, {});
		const { type, value } = RequestData;
		const condition = {
			conditions: {},
		};
		if (parseInt(type) === 1) {
			condition.conditions = { email: value };
		} else {
			condition.conditions = { phone: value };
		}
		const result = await DB.find('users', 'first', condition);
		if (result) {
			throw new ApiError(
				app.Message(parseInt(type) === 1 ? 'emailRegister' : 'phoneRegister')
			);
		}
		return {
			message: app.Message('signup'),
			data: {},
		};
	}
	async verifyOtp(req) {
		let required = {
			otp: req.body.otp,
		};
		let non_required = {};
		let request_data = await super.vaildation(required, non_required);
		if (parseInt(request_data.otp) !== req.body.userInfo.otp) {
			throw new ApiError(lang[req.lang].invaildOtp);
		}
		req.body.userInfo.status = 1;
		await DB.save('users', req.body.userInfo);
		const usersInfo = await super.userDetails(req.body.userInfo.id);
		if (usersInfo.profile.length > 0) {
			usersInfo.profile = appURL + 'uploads/' + usersInfo.profile;
		}
		return {
			message: app.Message('verifyOtp'),
			data: usersInfo,
		};
	}

	async soicalLogin(req) {
		const required = {
			social_id: req.body.social_id,
			social_token: req.body.social_token,
			soical_type: req.body.soical_type,
		};
		const non_required = {
			device_type: req.body.device_type,
			device_token: req.body.device_token,
			first_name: req.body.first_name,
			phone: req.body.phone,
			phone_code: req.body.phone_code,
			email: req.body.email,
			status: 1,
			latitude: req.body.latitude,
			longitude: req.body.longitude,
			address: req.body.address,
			dob: req.body.dob,
			authorization_key: app.createToken(),
		};

		const request_data = await super.vaildation(required, non_required);
		const soical_id = await DB.find('users', 'first', {
			conditions: {
				or: {
					email: request_data.email,
					social_id: request_data.social_id,
				},
			},
			fields: ['id'],
		});
		if (soical_id) {
			request_data.id = soical_id.id;
		}
		const id = await DB.save('users', request_data);
		const userInfo = await super.userDetails(id);
		if (userInfo.profile.length > 0) {
			userInfo.profile = appURL + 'uploads/' + userInfo.profile;
		}
		return {
			message: app.Message('LoginMessage'),
			data: userInfo,
		};
	}

	async checkSoical(Request) {
		const required = {
			social_id: Request.body.social_id,
		};
		const requestData = await super.vaildation(required, {});
		const soicalInfo = await DB.find('users', 'first', {
			conditions: {
				social_id: requestData.social_id,
			},
			fields: ['id'],
		});
		let isRegister = 0;
		if (soicalInfo) {
			isRegister = 1;
		}
		return {
			message: app.Message('LoginMessage'),
			data: {
				isRegister,
			},
		};
	}

	async forgotPassword(req) {
		let required = {
			email: req.body.email,
			otp: app.randomNumber(),
		};
		let non_required = {};
		let request_data = await super.vaildation(required, non_required);
		let user_info = await DB.find('users', 'first', {
			conditions: {
				email: request_data.email,
			},
			fields: ['id', 'email', 'first_name', 'last_name'],
		});
		if (!user_info) throw new ApiError(app.Message('mailNotFound'));
		user_info.otp = request_data.otp;
		user_info.forgot_password_hash = app.createToken();
		await DB.save('users', user_info);
		let mail = {
			to: request_data.email,
			subject: 'Forgot Password',
			template: 'forgot_password',
			data: {
				first_name: user_info.first_name,
				last_name: user_info.last_name,
				url: appURL + 'users/change_password/' + user_info.forgot_password_hash,
			},
		};
		setTimeout(() => {
			app.send_mail(mail);
		}, 100);
		return {
			message: app.Message('otpSend'),
			data: [],
		};
	}

	async loginUser(req) {
		const required = {
			email: req.body.email,
			password: req.body.password,
			user_type: req.body.user_type || 4,
		};
		const non_required = {
			device_type: req.body.device_type || 0,
			device_token: req.body.device_token || '',
			last_login: app.currentTime,
			authorization_key: app.createToken(),
		};

		const request_data = await super.vaildation(required, non_required);
		let login_details = await DB.find('users', 'first', {
			conditions: {
				email: request_data.email,
				user_type: request_data.user_type,
			},
			fields: ['id', 'password', 'status', 'email'],
		});
		if (login_details) {
			if (request_data.password !== login_details.password)
				throw new ApiError(app.Message('wrongLogin'));
			delete login_details.password;
			request_data.id = login_details.id;
			await DB.save('users', request_data);
			login_details.authorization_key = request_data.authorization_key;
			login_details = await super.userDetails(login_details.id);
			if (login_details.profile.length > 0) {
				login_details.profile = appURL + 'uploads/' + login_details.profile;
			}
			return {
				message: app.Message('LoginMessage'),
				data: login_details,
			};
		}
		throw new ApiError(app.Message('wrongLogin'));
	}
	async appInfo() {
		const app_info = await DB.find('app_informations', 'all');
		return {
			message: app.Message('appInfo'),
			data: app_info,
		};
	}
	async changePassword(req) {
		let required = {
			old_password: req.body.old_password,
			new_password: req.body.new_password,
		};
		let request_data = await super.vaildation(required, {});
		const loginInfo = req.body.userInfo;
		if (loginInfo.password !== request_data.old_password) {
			throw new ApiError(app.Message('oldPassword'));
		}
		loginInfo.password = request_data.new_password;
		await DB.save('users', loginInfo);
		return {
			message: app.Message('ChangePassword'),
			data: [],
		};
	}

	async updateBankAccount(Request) {
		const required = {
			routing_number: Request.body.routing_number,
			account_number: Request.body.account_number,
			account_holder_name: Request.body.account_holder_name,
		};
		const requestData = await super.vaildation(required, {});
		const { routing_number, account_number, account_holder_name } = requestData;
		const { id, strip_id, stripe_bank_account_id } = Request.body.userInfo;
		await PaymentController.updateBank({
			bankDetails: {
				routing_number,
				account_number,
				account_holder_name,
			},
			strip_id,
			stripe_bank_account_id,
			userID: id,
		});
		await DB.save('users', {
			id,
			card_informations: JSON.stringify({
				routing_number,
				account_number,
				account_holder_name,
			}),
		});
		const usersinfo = await super.userDetails(id);
		if (usersinfo.profile.length > 0) {
			usersinfo.profile = appURL + 'uploads/' + usersinfo.profile;
		}
		return {
			message: 'Bank account details Updated',
			data: usersinfo,
		};
	}

	async updateProfile(req) {
		const required = {
			id: req.body.user_id,
		};
		const non_required = {
			latitude: req.body.latitude,
			longitude: req.body.longitude,
			address: req.body.address,
			paypal_email: req.body.paypal_email,
			stripe_id: req.body.stripe_id,
			accept_order: req.body.accept_order,
			taxes: req.body.taxes,
			service_fees: req.body.service_fees,
			card_informations: req.body.card_informations,
			first_name: req.body.first_name,
			last_name: req.body.last_name,
			is_free: req.body.is_free,
			is_online: req.body.is_online,
			delivery_charges: req.body.delivery_charges,
			min_order: req.body.min_order,
			order_notification: req.body.order_notification,
			notification_on: req.body.notification_on,
			language: req.body.language,
			dob: req.body.language,
		};
		const request_data = await super.vaildation(required, non_required);
		if (req.files && req.files.profile) {
			request_data.profile = await app.upload_pic_with_await(req.files.profile);
		}
		await DB.save('users', request_data);
		const usersinfo = await super.userDetails(request_data.id);
		if (usersinfo.profile.length > 0) {
			usersinfo.profile = appURL + 'uploads/' + usersinfo.profile;
		}
		return {
			message: app.Message('ChangeProfile'),
			data: usersinfo,
		};
	}

	async logout(req) {
		let required = {
			id: req.body.user_id,
		};
		let request_data = await super.vaildation(required, {});
		request_data.authorization_key = '';
		await DB.save('users', request_data);
		return {
			message: app.Message('logoutUser'),
			data: [],
		};
	}
	mails(request_data) {
		let mail = {
			to: request_data.email,
			subject: 'User Account Verification',
			template: 'user_signup',
			data: {
				first_name: request_data.username,
				last_name: request_data.username,
				url: appURL + 'users/verify/' + request_data.authorization_key,
			},
		};
		try {
			app.sendSMS({
				to: `${request_data.phone_code}${request_data.phone}`,
				message: `${request_data.otp} ${lang[request_data.lang].OTP}`,
			});
			app.send_mail(mail);
			return true;
		} catch (error) {
			//
		}
	}
}

module.exports = UserController;

const paymentRegister = (RequestData, user_id) => {
	const {
		email,
		card_informations,
		user_type,
		address,
		latitude,
		longitude,
	} = RequestData;
	DB.save('user_addresses', {
		address,
		latitude,
		longitude,
		is_default: 1,
		user_id,
	});
	if (parseInt(user_type) !== 0) {
		//PaymentController.createAccount(user_id, email, card_informations);
	}
};
