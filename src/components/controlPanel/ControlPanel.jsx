import React, { useState } from 'react';
import './ControlPanel.css';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import { AddRegistroModal } from '../modal';
import { ComboBoxComponent } from '../combos';

export const ControlPanel = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="control-panel__wrapper">
                <div className="control-panel">
                    <div className="control-panel__left">
                        <h2 className="control-panel__title">Perfil de Control</h2>
                        {/* <AddCircleOutlineRoundedIcon onClick={() => setOpen(true)} className='control-panel__add-btn' /> */}
                    </div>
                    <ComboBoxComponent />
                </div>
            </div>

            {/* Modal */}
            < AddRegistroModal open={open} onClose={() => setOpen(false)} />
        </>
    );
};
