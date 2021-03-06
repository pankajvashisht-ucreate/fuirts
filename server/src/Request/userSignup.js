const { vaildation } = require('../../utils/DataValidation');
const app = require('../../libary/CommanMethod');
module.exports = async (Request, res, next) => {
	const requried = {
		first_name: Request.body.first_name,
		last_name: Request.body.last_name,
		email: Request.body.email,
		phone: Request.body.phone,
		phone_code: Request.body.phone_code,
		password: Request.body.password,
		latitude: Request.body.latitude,
		longitude: Request.body.longitude,
		address: Request.body.address,
		user_type: Request.body.user_type,
		checkexist: 1,
	};
	const non_required = {
		device_type: Request.body.device_type,
		paypal_email: Request.body.paypal_email || '',
		stripe_id: Request.body.stripe_id || '',
		taxes: Request.body.taxes,
		service_fees: Request.body.service_fees,
		device_token: Request.body.device_token,
		card_informations: Request.body.card_informations,
		dob: Request.body.dob,
		app_category_id: Request.body.app_category_id || 1,
		authorization_key: app.createToken(),
		status: 1, //app.randomNumber(),
	};
	try {
		Request.RequestData = await vaildation(requried, non_required);
		next();
	} catch (err) {
		return app.error(res, err);
	}
};
