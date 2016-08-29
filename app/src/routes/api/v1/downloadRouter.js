'use strict';

var Router = require('koa-router');
var logger = require('logger');
var json2csv = require('json2csv');
var microserviceClient = require('vizz.microservice-client');
var router = new Router({
    prefix: '/download'
});

var supportFormats = ['csv', 'json'];


class DownloadRouter {



    static * download() {
        if (!this.query.sql && !this.query.outFields && !this.query.outStatistics) {
            this.throw(400, 'sql or fs required');
            return;
        }
        if (this.query.format && supportFormats.indexOf(this.query.format) === -1) {
            this.throw(400, `${this.query.format} not supported`);
            return;
        }
        let downloadFormat = this.query.format || 'csv';
        logger.info(`Download with format ${this.query.format}`);
        try{
            logger.debug('Query', `/query/${this.params.dataset}?${this.querystring}`);
            let result = yield microserviceClient.requestToMicroservice({
                uri: `/query/${this.params.dataset}?${this.querystring}`,
                method: 'GET',
                json: true
            });

            if (result.statusCode === 200 ) {
                let formatData = '';
                if (result.body.data && result.body.data.length > 0) {
                    switch (downloadFormat) {
                        case 'csv':
                            logger.debug('Is a csv');
                            formatData = json2csv({
                                data: result.body.data
                            });
                            this.type = 'text/csv';
                            this.response.attachment('download.csv');
                            break;
                        default:
                            logger.debug('Is a json');
                            this.type = 'application/json';
                            formatData = result.body.data;
                            this.response.attachment('download.json');
                    }

                }
                this.body = formatData;

            } else {
                this.throw(result.statusCode, result.body);
                return;
            }
        } catch(err) {
            logger.error('Error in query', err);
            throw err;
        }
    }


}

router.get('/:dataset', DownloadRouter.download);


module.exports = router;
