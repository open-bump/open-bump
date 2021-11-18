import { Button } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import React from "react";

interface IConfirmDialogProps {
  open: boolean;
  title?: string;
  content?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog(props: IConfirmDialogProps) {
  const handleClose = () => {
    props.onClose();
  };

  const handleConfirm = () => {
    props.onConfirm();
  };

  return (
    <Dialog open={props.open} onClose={handleClose}>
      <DialogTitle id="alert-dialog-title">
        {props.title || <>Reset Token?</>}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {props.content || (
            <>
              The current token will be revoked immediately and a new token
              created. You won't be able to revert back to the old token.
            </>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          Confirm Reset
        </Button>
      </DialogActions>
    </Dialog>
  );
}
