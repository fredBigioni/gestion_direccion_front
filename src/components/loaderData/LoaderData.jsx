import React from 'react'
import { useRecoilValue } from 'recoil';
import './loaderData.css';
import { loadingState } from '../../atoms';

export const LoaderData = ({ children }) => {
    const isLoading = useRecoilValue(loadingState);

    return (
        <>
            {isLoading && (
                <div className="loader-overlay">
                    <div className="loader">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                </div>
            )}
            {children}
        </>
    );
};
