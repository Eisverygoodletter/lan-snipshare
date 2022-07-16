// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createSocket, RemoteInfo, Socket } from 'dgram';
let socket : Socket | null = null;
let activePort = 5789;

function bindSocketReceiver() {
	socket!.on("message", (msg : Buffer, remInfo: RemoteInfo) => {
		vscode.window.showInformationMessage("A new snippet has been shared", "copy to clipboard", "ignore").then(selection => {
			if (selection === "copy to clipboard") {
				vscode.env.clipboard.writeText(msg.toString());
			}
		});
		console.log(msg.toString());
		vscode.window.showInformationMessage(msg.toString());
	});
	socket!.bind(activePort);
}

function rebindSocketPort(newPort : number) {
	if (socket) {
		socket.close();
	}
	socket = createSocket('udp4');
	activePort = newPort;
	bindSocketReceiver();
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "lan-snipshare" is now active!');
	socket = createSocket('udp4');
	bindSocketReceiver();

	let activateSnippetSharing = vscode.commands.registerCommand('lan-snipshare.activateSnippetSharing', () => {
		vscode.window.showInformationMessage("snippet sharing active");
	});

	let shareSnippet = vscode.commands.registerCommand("lan-snipshare.shareSnippet", () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selections = editor.selections;
			let confirmationText = "";
			if (selections.length === 1) {
				confirmationText = "Are you sure you want to share this snippet?";
			}
			else {
				confirmationText = "Concatenate then share the selected snippets?";
			}
			let concatenatedText = "";
			for (let selection of selections) {
				const text = editor.document.getText(selection);
				concatenatedText += text;
			}
			vscode.window.showInformationMessage(confirmationText, "Yes", "No").then((answer) => {
				if (answer === "Yes") {
					if (socket !== null) {
						let nonNullSocket : Socket = socket!;
						nonNullSocket.send(concatenatedText, 0, concatenatedText.length, activePort, '239.255.255.250');
					}
				}
			});
		}
		else {
			vscode.window.showInformationMessage("Error: no activeTextEditor.");
		}
	});

	context.subscriptions.push(shareSnippet);
	context.subscriptions.push(activateSnippetSharing);
}

// this method is called when your extension is deactivated
export function deactivate() {}
