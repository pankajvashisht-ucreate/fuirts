import React, { memo } from 'react';
import {
	Redirect,
	Route,
	Switch,
	BrowserRouter as Router,
} from 'react-router-dom';
import { checkAuth } from 'utils/helper';
import Error from 'views/error';
const AuthRoute = ({ component: Component, ...rest }) => {
	return (
		<Route
			{...rest}
			render={(props) =>
				checkAuth('LoginUser') ? (
					<Component {...props} />
				) : (
					<Redirect
						to={{
							pathname: '/admin/login',
							state: { from: props.location },
						}}
					/>
				)
			}
		/>
	);
};

const AdminView = React.lazy(() =>
	import(/* webpackChunkName: "views-app" */ './Routes')
);
const Login = React.lazy(() =>
	import(/* webpackChunkName: "views-user" */ './login')
);

const Admin = () => {
	return (
		<Router basename='admin'>
			<Switch>
				<Route expect path='/login' component={Login} />
				<Route path='/error' component={Error} />
				{<AuthRoute path='/' component={AdminView} />}
			</Switch>
		</Router>
	);
};

export default memo(Admin);
