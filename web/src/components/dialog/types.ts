export type DialogIntent =
  | 'alertError'
  | 'alertWarning'
  | 'alertSuccess'
  | 'alertInfo'
  | 'message';

export type DialogState = {
  open: boolean;
  intent: DialogIntent;
  title?: string;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
};

export type DialogOpenInput = Omit<DialogState, 'open'>;

export type DialogContextValue = {
  open: (input: DialogOpenInput) => void;
  close: () => void;
};
