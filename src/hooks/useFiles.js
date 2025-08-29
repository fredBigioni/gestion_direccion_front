import { useRecoilState } from 'recoil';
import { loadingState } from '../atoms';
import api from '../api/api';
import { message } from 'antd';
import * as XLSX from 'xlsx';
import { MSGReader } from 'msgreader';

const useFiles = () => {
    const [isLoading, setIsLoading] = useRecoilState(loadingState);

    /**
     * Lista metadatos de archivos para un reporte dado.
     * @returns Array<{id, filename, mimetype, size}>
     */
    async function listFiles(reportId) {
        try {
          setIsLoading(true);
            const res = await api.get(`/home/files/${reportId}`);
            return res.data;
        } catch (err) {
            console.error('Error listando archivos:', err);
            message.error('No se pudieron cargar los archivos');
            return [];
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Descarga un archivo como Blob y fuerza la descarga.
     */
    async function downloadFile(file) {
        try {
          setIsLoading(true);
            const res = await api.get(`/home/files/download/${file.id}`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: file.mimetype });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error descargando archivo:', err);
            message.error('No se pudo descargar el archivo');
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Prepara un archivo para previsualizarlo:
     * - devuelve { blobUrl, text?, html? }
     */
    async function previewFile(file) {
        try {
          setIsLoading(true);
            const res = await api.get(
                `/home/files/download/${file.id}`,
                { responseType: 'blob' }
            );
            const blob = new Blob([res.data], { type: file.mimetype });
            const blobUrl = window.URL.createObjectURL(blob);
            let text = null;
            let html = null;

            if (file.mimetype.startsWith('text/')) {
                text = await blob.text();
            } else if (
                file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.mimetype === 'application/vnd.ms-excel'
            ) {
                // convertimos solo la tabla:
                const arrayBuffer = await res.data.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const fullHtml = XLSX.utils.sheet_to_html(sheet);
                // extraemos únicamente la <table>...</table>
                const match = fullHtml.match(/<table[\s\S]*<\/table>/i);
                html = match ? match[0] : '<p>No se pudo generar tabla.</p>';
            } else if (file.mimetype === 'application/vnd.ms-outlook') {
                const arrayBuffer = await res.data.arrayBuffer();
                const msgReader = new MSGReader(arrayBuffer);
                const msgInfo = msgReader.getFileData();
                html = msgInfo.body || '<i>(sin cuerpo)</i>';
            }

            return { blobUrl, text, html };
        } finally {
            setIsLoading(false);
        }
    }

    return {
        listFiles,
        downloadFile,
        previewFile,
        isLoading
    };
}

export default useFiles;