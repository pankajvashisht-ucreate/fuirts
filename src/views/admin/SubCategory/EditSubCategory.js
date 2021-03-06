import React, { Fragment, useState, useReducer } from 'react';
import { Colxx, Separator } from 'components/common/CustomBootstrap';
import { Row, Card, CardBody, CardTitle } from 'reactstrap';
import { editSubCategoryApi } from 'Apis/admin';
import AddSubCategory from 'containers/forms/AddSubCategory';
import { NotificationManager } from 'components/common/react-notifications';
const EditSubCategory = React.memo(({ history, location }) => {
	const reducer = (form, action) => {
		switch (action.key) {
			case action.key:
				return { ...form, [action.key]: action.value };
			default:
				throw new Error('Unexpected action');
		}
	};
	const initialState = { ...location.state.subCategory };
	const [SubCategoryForm, dispatch] = useReducer(reducer, initialState);
	const [loading, setIsLoading] = useState(false);
	const updateSubCategory = (event) => {
		setIsLoading(true);
		event.preventDefault();
		editSubCategoryApi(SubCategoryForm)
			.then(() => {
				history.push('/sub-categories');
				NotificationManager.success(
					'Category Edit successfully',
					'Success',
					3000,
					null,
					null,
					''
				);
			})
			.catch((err) => {
				if (err.response) {
					const { data } = err.response;
					NotificationManager.warning(
						data.error_message,
						'Something went wrong',
						3000,
						null,
						null,
						''
					);
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	const handleInput = (key, value) => {
		dispatch({ key, value });
	};
	return (
		<Fragment>
			<Row>
				<Colxx xxs='12'>
					<h1>Edit Sub Category ({SubCategoryForm.name})</h1>
					<Separator className='mb-5' />
				</Colxx>
			</Row>
			<Row className='mb-4'>
				<Colxx xxs='12'>
					<Card>
						<CardBody>
							<CardTitle>Edit Sub Category</CardTitle>
							<AddSubCategory
								onSubmit={updateSubCategory}
								loading={loading}
								isEdit
								SubCategoryForm={SubCategoryForm}
								handleInput={handleInput}
							/>
						</CardBody>
					</Card>
				</Colxx>
			</Row>
		</Fragment>
	);
});

export default EditSubCategory;
