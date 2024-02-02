const express = require('express')
const { google } = require('googleapis')
const app = express()
let port;


async function getAuthSheets() {

    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json',
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })

    const client = await auth.getClient();

    const googlesheets = google.sheets({
        version: 'v4',
        auth: client
    })

    const spreadSheetId = '1kY_edYv_PehDUHOkWUfXeDYYgv3KBC5nJj7Af5iMyJM'

    return {
        auth,
        googlesheets,
        client,
        spreadSheetId
    }
}


app.get("/metadata", async (req, res) => {
    try {

        const { googlesheets, auth, spreadSheetId } = await getAuthSheets();

        const metadata = await googlesheets.spreadsheets.get({
            auth,
            spreadsheetId: spreadSheetId
        })

        res.status(200).send(metadata);
    } catch (error) {
        res.status(500).send("Error" + error)
    }
})



app.listen(port = 3001, () => console.log(`Rodando na porta ${port}`))