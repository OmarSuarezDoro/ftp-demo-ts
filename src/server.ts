import fs, { ReadStream } from 'node:fs';
import net from 'node:net';
import chalk from 'chalk';

export type Message = {
  path: string;
  command: string;
  response: string;
};

class ServerHandler {
  private server_: net.Server;
  private response_: Message = { path: '', response: '', command: ''};
  constructor(port: number) {
    this.server_ = net.createServer((connection) => {
      console.log(chalk.green('[+]') + chalk.white(' A client has connected from: ') + chalk.blue(connection.remoteAddress?.replace('::ffff:', '')));
      // Initial Path
      this.response_ = { path: fs.realpathSync('.'), response: '', command: ''};
      connection.write(JSON.stringify(this.response_));
      
      // Handle the data event which is received from the client
      connection.on('data', (data) => {
        let message : Message = JSON.parse(data.toString());
        switch (message.command) {
          case 'ls':
            this.response_.response = fs.readdirSync(this.response_.path).join('\n');
            connection.write(JSON.stringify(this.response_));
            break;
          case 'pwd':
            this.response_.response = this.response_.path;
            connection.write(JSON.stringify(this.response_));
            break;
          case 'cd':
            if (fs.existsSync(this.response_.path + '/' + message.response)) {
              if (message.response === '..') {
                this.response_.path = this.response_.path.split('/').slice(0, -1).join('/');
              } else {
                this.response_.path += '/' + message.response;  
              }         
              this.response_.response = '';
              process.chdir(this.response_.path);
            } else {
              this.response_.response = 'Path does not exist';
            }
            connection.write(JSON.stringify(this.response_));
            break;

          case 'get':
            console.log('Entro!')
            console.log(this.response_.path + '/' + message.response);
            if (fs.existsSync(this.response_.path + '/' + message.response) && 
            fs.lstatSync(this.response_.path + '/' + message.response).isFile()) {
              let aux : ReadStream = fs.createReadStream(this.response_.path + '/' + message.response);
              aux.on('data', (data) => {
                this.response_.response = data.toString();
                console.log(' LO HE LEIDO PAPI!');
                connection.write(JSON.stringify(this.response_));
              });
            }
            console.log('Salgo!')
            break;
          case 'exit':
            connection.end();
            break;
          default:
            this.response_.response = 'Command not found';
            connection.write(JSON.stringify({ path: this.response_.path, response: '', command: ''}));
            return;
        }
        console.log(message);
      });

      // If the client disconnects
      connection.on('close', () => {
        console.log(chalk.red('[-]') + chalk.white(' A client has disconnected.'));
      });

      // If an error occurs
      connection.on('error', (err) => {
        console.log(chalk.red('[-]') + chalk.white(' An error has occurred: ') + chalk.red(err));
      });

    });

    this.server_.listen(port, () => {
      console.log(chalk.green('[+]') + chalk.white(' Server listening on port ' + chalk.green.bold(port)));
    });
  }
}

new ServerHandler(1337);