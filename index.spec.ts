import { StartedTestContainer, GenericContainer } from "testcontainers";

let container: StartedTestContainer;

beforeAll(async (done) => {
  container = await new GenericContainer("vault", "1.4.0")
    .withEnv("VAULT_DEV_ROOT_TOKEN_ID", "myroot")
    .withEnv("VAULT_DEV_LISTEN_ADDRESS", "0.0.0.0:1234")
    .withNetworkMode("bridge")
    .start();

  done();
});

afterAll(async (done) => {
  await container.stop();

  done();
});

test.todo("It can read string");
