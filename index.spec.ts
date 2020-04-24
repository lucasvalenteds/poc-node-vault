import { StartedTestContainer, GenericContainer } from "testcontainers";
import Vault from "node-vault";

let container: StartedTestContainer;
let client: Vault.client;

beforeAll(async (done) => {
  container = await new GenericContainer("vault", "latest")
    .withEnv("VAULT_DEV_ROOT_TOKEN_ID", "myroot")
    .withEnv("VAULT_DEV_LISTEN_ADDRESS", "0.0.0.0:1234")
    .withExposedPorts(1234)
    .withNetworkMode("bridge")
    .start();

  const [host, port] = [
    container.getContainerIpAddress(),
    container.getMappedPort(1234),
  ];

  client = Vault({
    apiVersion: "v1",
    endpoint: `http://${host}:${port}`,
    token: "myroot",
  });

  done();
});

afterAll(async (done) => {
  await container.stop();

  done();
});

beforeEach(async (done) => {
  await Promise.all([
    client.write("cubbyhole/dev", {
      serviceUrl: "http://dev.service.com/api",
    }),
    client.write("cubbyhole/prod", {
      serviceUrl: "https://api.service.com",
      apiToken: "e1d80eef6ddd05ec5fc78583ee9317a0",
    }),
  ]);

  done();
});

afterEach(async (done) => {
  await Promise.all([
    client.delete("cubbyhole/dev"),
    client.delete("cubbyhole/prod"),
  ]);

  done();
});

test("It can read service URL from development environment", async () => {
  const response = await client.read("cubbyhole/dev");

  expect(response.request_id).toEqual(expect.any(String));
  expect(response.data.serviceUrl).toStrictEqual("http://dev.service.com/api");
  expect(response.data.apiToken).toBeUndefined();
});

test("It can read service URL from production environment", async () => {
  const response = await client.read("cubbyhole/prod");

  expect(response.request_id).toEqual(expect.any(String));
  expect(response.data).toStrictEqual({
    serviceUrl: "https://api.service.com",
    apiToken: "e1d80eef6ddd05ec5fc78583ee9317a0",
  });
});
