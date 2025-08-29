import React, { useState } from 'react';
import './ControlPanel.css';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import { AddRegistroModal } from '../modal';
import { ComboBoxComponent } from '../combos';

export const ControlPanel = ({ user }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* {user.rol.name.toLowerCase() == 'control' || user.rol.name.toLowerCase() == 'admin' ? <> */}
                <div className="control-panel__wrapper">
                    <div className="control-panel">
                        <div className="control-panel__left">
                            <h2 className="control-panel__title">{user.firstName + ' ' + user.lastName + ' - '} Perfil de {user.rol.name}</h2>
                        </div>
                        <ComboBoxComponent user={user} />
                    </div>
                </div>

                {/* Modal */}
                < AddRegistroModal open={open} onClose={() => setOpen(false)} />
            {/* </> :
                <></>
            } */}

        </>
    );
};
