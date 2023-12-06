import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IRouter,
} from '@jupyterlab/application';

import '@jupyterlab/application/style/buttons.css';

import '../style/index.css';

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
      label: 'Log Out',
      execute: (args: any) => {
        // Fix this!
        router.navigate('/shutdown', { hard: true });
      },
    });
  },
};

export default extension;
