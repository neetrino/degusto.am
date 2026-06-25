export type IdramFormData = {
  EDP_LANGUAGE: string;
  EDP_REC_ACCOUNT: string;
  EDP_DESCRIPTION: string;
  EDP_AMOUNT: string;
  EDP_BILL_NO: string;
  EDP_EMAIL?: string;
};

export type IdramInitResult = {
  formAction: string;
  formData: IdramFormData;
};

export type IdramCallbackFields = {
  EDP_PRECHECK?: string;
  EDP_BILL_NO?: string;
  EDP_REC_ACCOUNT?: string;
  EDP_AMOUNT?: string;
  EDP_PAYER_ACCOUNT?: string;
  EDP_TRANS_ID?: string;
  EDP_TRANS_DATE?: string;
  EDP_CHECKSUM?: string;
};
