import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IRouter,
} from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

import { URLExt } from '@jupyterlab/coreutils';

import '@jupyterlab/application/style/buttons.css';

import '../style/index.css';

import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';

const shutdownPluginId = 'jupyterlab-shutdown:plugin';

const extension: JupyterFrontEndPlugin<void> = {
  id: shutdownPluginId,
  autoStart: true,
  requires: [IRouter],
  activate: async (app: JupyterFrontEnd, router: IRouter): Promise<void> => {
    console.log('jupyterlab-shutdown extension is activated!');

    // Get app commands
    const { commands } = app;

    const namespace = 'jupyterlab-topbar';
    const command = namespace + ':shutdown';

    commands.addCommand(command, {
      label: 'Shut Down',
      caption: 'Shut down user session',
      execute: (args: any) => {
        return showDialog({
          title: 'Shut down Analysis Facility session',
          body: 'Warning: unsaved data will be lost!',
          buttons: [
            Dialog.cancelButton(),
            Dialog.warnButton({ label: 'Shut Down' })
          ]
        }).then(async (result: any) => {
          if (result.button.accept) {
            const setting = ServerConnection.makeSettings();
            const apiURL = URLExt.join(setting.baseUrl, 'api/shutdown');
            // Shutdown all kernel and terminal sessions before shutting down the server
            // If this fails, we continue execution so we can post an api/shutdown request
            try {
              await Promise.all([
                app.serviceManager.sessions.shutdownAll(),
                app.serviceManager.terminals.shutdownAll()
              ]);
            } catch (e) {
              // Do nothing
              console.log(`Failed to shutdown sessions and terminals: ${e}`);
            }

            return ServerConnection.makeRequest(
              apiURL,
              { method: 'POST' },
              setting
            )
              .then((result: any) => {
                if (result.ok) {
                  // Close this window if the shutdown request has been successful
                  const body = document.createElement('div');
                  const p1 = document.createElement('p');
                  p1.textContent =
                    'You have shut down the Analysis Facility session.';

                  const baseUrl = new URL(setting.baseUrl);
                  const link = document.createElement('a');
                  link.href =
                    baseUrl.protocol + '//' + baseUrl.hostname + '/home';
                  link.textContent =
                    'Click here or refresh the page to restart the session.';
                  link.style.color = 'var(--jp-content-link-color)';

                  body.appendChild(p1);
                  body.appendChild(link);
                  void showDialog({
                    title: 'Session closed.',
                    body: new Widget({ node: body }),
                    buttons: []
                  });
                } else {
                  throw new ServerConnection.ResponseError(result);
                }
              })
              .catch((data: any) => {
                throw new ServerConnection.NetworkError(data);
              });
          }
        });
      },
    });
  },
};

export default extension;
