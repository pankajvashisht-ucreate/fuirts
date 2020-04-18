import React, { Component } from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import AppLocale from 'lang';
import ColorSwitcher from 'components/common/ColorSwitcher';
import NotificationContainer from 'components/common/react-notifications/NotificationContainer';
import { isMultiColorActive } from 'constants/defaultValues';
import { getDirection } from 'helpers/Utils';
import Routes from 'views';

class App extends Component {
	constructor(props) {
		super(props);
		const direction = getDirection();
		if (direction.isRtl) {
			document.body.classList.add('rtl');
			document.body.classList.remove('ltr');
		} else {
			document.body.classList.add('ltr');
			document.body.classList.remove('rtl');
		}
	}

	render() {
		const { locale } = this.props;
		const currentAppLocale = AppLocale[locale];

		return (
			<div className='h-100'>
				<IntlProvider
					locale={currentAppLocale.locale}
					messages={currentAppLocale.messages}
				>
					<React.Fragment>
						<NotificationContainer />
						{isMultiColorActive && <ColorSwitcher />}
						<Routes />
					</React.Fragment>
				</IntlProvider>
			</div>
		);
	}
}

const mapStateToProps = ({ authUser, settings }) => {
	const { user: loginUser } = authUser;
	const { locale } = settings;
	return { loginUser, locale };
};
const mapActionsToProps = {};

export default connect(mapStateToProps, mapActionsToProps)(App);
