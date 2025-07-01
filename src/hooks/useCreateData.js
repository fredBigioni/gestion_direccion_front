// src/hooks/useCreateData.js

import { useRecoilState } from "recoil";
import { loadingState } from "../atoms";
import api from "../api/api";
import { message } from "antd";

/**
 * Hook para crear o actualizar datos desde el modal.
 * createData(data: FormData) → POST /home/postData
 * updateData(id, data: FormData) → PUT /home/putData/:id
 */
const useCreateData = () => {
    const [isLoading, setIsLoading] = useRecoilState(loadingState);

    const createData = async (formData) => {
        try {
            setIsLoading(true);
            debugger;
            const response = await api.post(
                `/home/postData`,
                formData,
                {
                    headers: {
                        // Deja que el navegador/Axios añada el boundary
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            message.success('Registro creado correctamente');
            return response.data;
        } catch (error) {
            console.error('Error en createData:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
            message.error(`Error al crear la información: ${errorMsg}`);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateData = async (id, formData) => {
        try {
            setIsLoading(true);
            const response = await api.put(
                `/home/putData/${id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            message.success('Registro actualizado correctamente');
            return response.data;
        } catch (error) {
            console.error('Error en updateData:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
            message.error(`Error al modificar la información: ${errorMsg}`);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createData,
        updateData,
        isLoading,
    };
};

export default useCreateData;
