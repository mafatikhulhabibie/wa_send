const cron = require('node-cron');
const { phoneNumberFormatter } = require('./formatter');

module.exports = function (db, sessionMap) {
    cron.schedule('* * * * *', function () {
        console.log('cronjob berjalan')
        let sqlde = `SELECT *  FROM device`;
        db.query(sqlde, function (err, results) {
            results.forEach(async de => {
                if (sessionMap.has(parseInt(de.nomor))) {
                    let sql = `SELECT * FROM pesan WHERE status='MENUNGGU JADWAL' OR status='GAGAL' AND sender = ${de.nomor} LIMIT ${de.chunk}`;
                    var sekarang = new Date().getTime();
                    const velixs = sessionMap.get(parseInt(de.nomor)).chika
                    db.query(sql, function (err, result) {
                        result.forEach(async d => {
                            const yourDate = new Date(d.jadwal)
                            const waktu = yourDate.getTime()
                            if (sekarang >= waktu) {
                                if (d.nomor.length > 15) {
                                    var number = d.nomor;
                                } else {
                                    var number = phoneNumberFormatter(d.nomor);
                                }
                                console.log(`Mengirim Ke Nomer ${number}`)
                                if (d.media == null || d.media == '') {
                                    velixs.sendMessage(number, { text: d.pesan }).then(response => {
                                        db.query(`UPDATE pesan SET status = 'TERKIRIM' where id = ${d.id}`)
                                    }).catch(err => {
                                        db.query(`UPDATE pesan SET status = 'GAGAL' where id = ${d.id}`)
                                    });
                                } else {
                                    let filename = d.media.split('/')[d.media.split('/').length - 1];
                                    let filetype = filename.split('.')[1]
                                    if (filetype == 'jpg' || filetype == 'png' || filetype == 'jpeg') {
                                        velixs.sendMessage(number, { image: { url: `${d.media}` }, caption: `${d.pesan}` }).then(response => {
                                            db.query(`UPDATE pesan SET status = 'TERKIRIM' where id = ${d.id}`)
                                        }).catch(err => {
                                            db.query(`UPDATE pesan SET status = 'GAGAL' where id = ${d.id}`)
                                        });
                                    } else if (filetype == 'pdf') {
                                        velixs.sendMessage(number, { document: { url: `${d.media}` }, mimetype: 'application/pdf', fileName: `${d.pesan}` }).then(response => {
                                            db.query(`UPDATE pesan SET status = 'TERKIRIM' where id = ${d.id}`)
                                        }).catch(err => {
                                            db.query(`UPDATE pesan SET status = 'GAGAL' where id = ${d.id}`)
                                        });
                                    } else {
                                        res.status(500).json({
                                            status: false,
                                            response: 'Filetype tidak dikenal'
                                        });
                                    }
                                }
                            }
                        })

                    });
                    let sql2 = `SELECT * FROM blast WHERE sender = ${de.nomor} AND status != 'terkirim' LIMIT ${de.chunk}`;
                    db.query(sql2, function (err, resultss) {
                        resultss.forEach(async dw => {
                            if (dw.tujuan.length > 15) {
                                var number = dw.tujuan;
                            } else {
                                var number = phoneNumberFormatter(dw.tujuan);
                            }
                            console.log(`Mengirim Ke Nomer ${number}`)
                            if (dw.media == '' || dw.media == null) {
                                velixs.sendMessage(number, { text: dw.pesan }).then(response => {
                                    db.query(`UPDATE blast SET status = 'terkirim' where id = ${dw.id}`)
                                }).catch(err => {
                                    db.query(`UPDATE blast SET status = 'gagal' where id = ${dw.id}`)
                                });
                            } else {
                                let filename = dw.media.split('/')[dw.media.split('/').length - 1];
                                let filetype = filename.split('.')[1]
                                if (filetype == 'jpg' || filetype == 'png' || filetype == 'jpeg') {
                                    velixs.sendMessage(number, { image: { url: `${dw.media}` }, caption: `${dw.pesan}` }).then(response => {
                                        db.query(`UPDATE blast SET status = 'terkirim' where id = ${dw.id}`)
                                    }).catch(err => {
                                        db.query(`UPDATE blast SET status = 'gagal' where id = ${dw.id}`)
                                    });
                                } else if (filetype == 'pdf') {
                                    velixs.sendMessage(number, { document: { url: `${dw.media}` }, mimetype: 'application/pdf', fileName: `${dw.pesan}` }).then(response => {
                                        db.query(`UPDATE blast SET status = 'terkirim' where id = ${dw.id}`)
                                    }).catch(err => {
                                        db.query(`UPDATE blast SET status = 'gagal' where id = ${dw.id}`)
                                    });
                                }
                            }
                        })
                    });
                }
            })
        })

    });
};