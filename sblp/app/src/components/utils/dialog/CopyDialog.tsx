import { Button } from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import React, { useEffect, useRef } from "react";

interface ICopyDialogProps {
  open: boolean;
  value: string;
  onClose: () => void;
}

export default function CopyDialog(props: ICopyDialogProps) {
  const inputRef = useRef<HTMLInputElement>();

  const handleClose = (event?: any) => {
    if (event) event.preventDefault();
    props.onClose();
  };

  useEffect(() => {
    if (props.open)
      setTimeout(() => {
        inputRef.current?.select();
        document.execCommand("copy");
      });
  }, [props.open]);

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Copy Content</DialogTitle>
      <DialogContent>
        <form onSubmit={handleClose}>
          <DialogContentText id="alert-dialog-description">
            Press CTRL+C to copy the content of the field below.
          </DialogContentText>
          <TextField
            autoFocus
            value={props.value}
            fullWidth
            inputRef={inputRef}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Finished
        </Button>
      </DialogActions>
    </Dialog>
  );
}
