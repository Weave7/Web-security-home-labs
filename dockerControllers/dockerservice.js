const Docker = require('dockerode');
const docker = new Docker(); 

// Map your labIds to their corresponding Docker images
const LAB_IMAGES = {
    'basic-ssrf-against-localhost': 'corpconnect-lab:latest',
    // add future labs here
};

async function startLabInstance(categoryId, labId, instanceId) {
    try {
        const imageTag = LAB_IMAGES[labId];
        if (!imageTag) throw new Error(`Unknown lab ID: ${labId}`);

        console.log(`Creating container for lab instance ${instanceId}...`);

        const PORT = process.env.PORT || 3000;

        const webhookUrl = `http://172.17.0.1:${PORT}/api/labs/solve`;

        const container = await docker.createContainer({
            Image: imageTag,
            name: `lab-${instanceId}`,
            // Pass the variables so Python knows who it is!
            Env: [
                `INSTANCE_ID=${instanceId}`,
                `CONTROL_PANEL_URL=${webhookUrl}`
            ],
            HostConfig: {
                PublishAllPorts: true, // Binds exposed container ports to random host ports
                ExtraHosts: ["host.docker.internal:host-gateway"]
            }
        });

        await container.start();
        
        const containerInfo = await container.inspect();
        const networkSettings = containerInfo.NetworkSettings.Ports;
        
        // Flask exposes 5000/tcp. Let's find out what random port the host assigned it to.
        if (!networkSettings['5000/tcp']) {
            throw new Error("Port 5000 is not exposed by this container.");
        }
        const mappedPort = networkSettings['5000/tcp'][0].HostPort;

        // --- AUTO-SHUTDOWN TIMER ---
        const TIME_LIMIT_MS = 60 * 60 * 1000; // 1 hour
        setTimeout(async () => {
            console.log(`Time limit reached for instance ${instanceId}. Shutting down...`);
            try {
                await stopLabInstance(container.id);
            } catch (err) {
                console.error(`Failed to auto-stop instance ${instanceId}:`, err);
            }
        }, TIME_LIMIT_MS);
        // ---------------------------

        return {
            instanceId,
            containerId: container.id,
            url: `http://localhost:${mappedPort}`,
            status: 'running',
            expiresIn: TIME_LIMIT_MS
        };

    } catch (error) {
        console.error("Failed to start lab instance:", error);
        throw error;
    }
}

async function stopLabInstance(containerId) {
    try {
        const container = docker.getContainer(containerId);
        await container.stop();
        await container.remove();
        return { status: 'stopped and removed' };
    } catch (error) {
        console.error("Failed to stop lab instance:", error);
        throw error;
    }
}

module.exports = {
    startLabInstance,
    stopLabInstance
};