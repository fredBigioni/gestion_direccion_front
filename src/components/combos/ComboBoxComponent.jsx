// components/ComboBoxComponent.js
import React, { useEffect, useState } from "react";
import { useRecoilState } from 'recoil';
import useHome from "../../hooks/useHome";
import { selectedCompanyState } from '../../atoms/selectedCompanyState';

const companyRoemmersId = import.meta.env.VITE_API_COMPANY_ID;

export const ComboBoxComponent = ({ user }) => {
    const { getAllCompanies, getAllCompanyTypes, getData, companies, companyTypes, isLoading } = useHome();

    // local
    const [companyTypeSelected, setCompanyTypeSelected] = useState(null);

    // recoil
    const [companySelected, setCompanySelected] = useRecoilState(selectedCompanyState);

    useEffect(() => {
        // inicializa con el default
        setCompanySelected(companyRoemmersId);
        getAllCompanies();
        getAllCompanyTypes(companyRoemmersId);
        getData(companyRoemmersId, null, user.id);
    }, []);

    const onCompanySelected = async (e) => {
        const id = e.target.value;
        setCompanySelected(id);
        await getAllCompanyTypes(id);
        await getData(id, null, user.id);
    };

    const onCompanyTypeSelected = async (e) => {
        const typeId = e.target.value;
        if (typeId.toLowerCase() !== 'todas') {
            setCompanyTypeSelected(typeId);
            await getData(companySelected, typeId, user.id);
        } else {
            setCompanyTypeSelected(null);
            await getData(companySelected, null, user.id);
        }
    };

    return (
        <div className="control-panel__right">
            <div className="control-panel__field">
                <label htmlFor="compania">Compañías</label>
                <select
                    id="compania"
                    name="compania"
                    disabled={isLoading}
                    value={companySelected ?? ''}
                    onChange={onCompanySelected}
                >
                    {companies && companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className="control-panel__field">
                <label htmlFor="representacion">Representación</label>
                <select
                    id="representacion"
                    name="representacion"
                    value={companyTypeSelected ?? 'todas'}
                    onChange={onCompanyTypeSelected}
                >
                    <option value="todas">Todas</option>
                    {companyTypes && companyTypes.map(ct => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
