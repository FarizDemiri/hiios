
import { crashLoopBackOffMode } from './modes/crashloop.js';
import { imagePullBackOffMode } from './modes/imagepull.js';
import { oomKilledMode } from './modes/oom.js';
import { serviceNoEndpointsMode } from './modes/service-no-endpoints.js';

export const allFailureModes = [
    crashLoopBackOffMode,
    imagePullBackOffMode,
    oomKilledMode,
    serviceNoEndpointsMode
];
