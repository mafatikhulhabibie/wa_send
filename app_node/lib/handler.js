const { phoneNumberFormatter } = require('./formatter');
const request = require('request');

module.exports = function (chika, chatUpdate, db) {
    mek = chatUpdate.messages[0]
    text = mek.message.conversation
    sender = mek.key.remoteJid
    mynumb = chika.decodeJid(chika.user.id).replace(/\D/g, '')

    let sqlautoreply = `SELECT * FROM autoreply WHERE keyword = "${text}" AND nomor = "${mynumb}"`;
    db.query(sqlautoreply, function (err, result) {
        if (!err) {
            result.forEach(data => {
                console.log('send autoreply ke ' + sender)
                if (data.media == '') {
                    chika.sendMessage(sender, { text: data.response })
                } else {
                    var media = `${data.media}`;
                    const ress = data.response
                    const array = media.split(".");
                    const ext = array[array.length - 1];
                    if (ext == 'jpg' || ext == 'png' || ext == 'jpeg') {
                        chika.sendMessage(sender, { image: { url: `${media}` }, caption: `${ress}` })
                    } else if (ext == 'pdf') {
                        const getlink = media.split("/");
                        const namefile = getlink[getlink.length - 1]
                        let getstorage = `SELECT * FROM storage WHERE namafile = "${namefile}"`;
                        db.query(getstorage, function (err, result) {
                            if (err) throw err;
                            result.forEach(gs => {
                                chika.sendMessage(sender, { document: { url: `${media}` }, mimetype: 'application/pdf', fileName: `${gs.nama_original.split('.')[0]}` })
                            })
                        })
                    }
                }
            });
        }
    });

    let sqlhook = `SELECT link_webhook FROM device WHERE nomor = ${mynumb} `;
    db.query(sqlhook, function (err, result) {
        if (!err) {
            const webhookurl = result[0].link_webhook;
            if (webhookurl != '' || webhookurl != null) {
                const pesan = {
                    sender: phoneNumberFormatter(sender),
                    msg: text
                }
                kirimwebhook(sender, text, chika, webhookurl);
            }
        }
    });

    function kirimwebhook(sender, message, chika, link) {

        var webhook_response = {
            from: phoneNumberFormatter(sender),
            message: message
        }
        request({
            url: link,
            method: "POST",
            json: webhook_response
        },
            async function (error, response) {
                if (!error && response.statusCode == 200) {
                    if (response.body == null) {
                        return 'gagal send webhook';
                    }
                    const res = response.body;
                    if (res.mode == 'chat') {
                        chika.sendMessage(sender, { text: res.pesan })
                    } else if (res.mode == 'reply') {
                        chika.sendMessage(sender, { text: res.pesan }, { quoted: mek })
                    } else if (res.mode == 'picture') {
                        const url = res.data.url;
                        const caption = res.data.caption;
                        chika.sendMessage(sender, { image: { url: `${url}` }, caption: `${caption}` })
                    }
                } else {
                    console.log('Webhook 404');
                }
            }
        );
    }

}