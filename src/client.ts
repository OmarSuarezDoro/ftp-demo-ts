import net from 'node:net';
import chalk from 'chalk';

export type Message = {
  path: string;
  command: string;
  response: string;
};


class ClientConnectionHandler {
  private clientSocket_;
  //private actualPath_: string = '';

  constructor(port : number) {
    this.clientSocket_ = net.connect({port: port});
    console.log(chalk.green('[+]') + chalk.white(' Connected to server'), '\n');
    // Handle the data event which is received from the server
    this.clientSocket_.on('data', (data) => {
      let message : Message = JSON.parse(data.toString());
      console.log(message.response);
      process.stdout.write(chalk.blue(`${message.path}> `));
    });

    // Handle the input from the user and send it to the server
    process.stdin.on('data', (data) => {
      let message : string = data.toString().trim();
      let messageArray : string[] = message.split(' ');
      message = messageArray.splice(0, 1).join();
      this.clientSocket_.write(JSON.stringify({ command: message, response: messageArray.join(), path: ''}));
    });

    // If the server disconnects
    this.clientSocket_.on('close', () => {
      console.log(chalk.red('[-]') + chalk.white(' The server has disconnected.'));
      process.exit(0);
    });
  }
}

new ClientConnectionHandler(1337);