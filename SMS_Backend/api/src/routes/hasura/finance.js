import { registrationPaymentQuoteAction } from '../../controllers/finance/actions.js';
import { hasuraAction } from '../../middlewares/hasuraAction.js';

export const registerFinanceHasuraActions = (router) => {
  router.post(
    '/finance/registration-payment-quote',
    ...hasuraAction({ requireUser: true, handler: registrationPaymentQuoteAction })
  );
};
