import axios from "axios";

function getUploadErrorMessage(err: unknown, switchMessage: string): string {
    if (axios.isAxiosError(err)) {
        if (!err.response) {
            return "Could not reach the server. Check your connection and try again.";
        }

        const data = err.response.data as
            | { error?: string; details?: { message: string; row?: number }[] }
            | undefined;

        if (data?.error) {
            const first = data.details?.[0];
            if (!first) return data.error;
            const location = first.row !== undefined ? ` (row ${first.row}: ${first.message})` : ` (${first.message})`;
            return data.error + location;
        }

        return err.message;
    }

    return err instanceof Error ? err.message : switchMessage;
}





export { getUploadErrorMessage }