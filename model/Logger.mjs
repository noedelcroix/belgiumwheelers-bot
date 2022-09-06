import winston from 'winston';

export default class Logger{
    #logger;
    constructor(){
        this.#logger = winston.createLogger({
            level: "silly",
            transports: [
                new winston.transports.File({ filename: 'combined.log' }),
            ]
          });
    }

    log = (data)=>{
        this.#logger.log('info', data);
    }
}