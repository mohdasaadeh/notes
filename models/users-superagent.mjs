import { default as request } from "superagent";
import util from "util";
import url from "url";
import DBG from "debug";

const URL = url.URL;

const debug = DBG("notes:users-superagent");
const error = DBG("notes:error-superagent");

const authid = "them";
const authcode = "D4ED43C0-8BD6-4FE2-B358-7C0E230D11EF";

function reqURL(path) {
  const requrl = new URL(process.env.USER_SERVICE_URL);

  requrl.pathname = path;

  return requrl.toString();
}

export async function create(
  username,
  password,
  provider,
  familyName,
  givenName,
  middleName,
  emails,
  photos
) {
  const res = await request
    .post(reqURL("/create-user"))
    .send({
      username,
      password,
      provider,
      familyName,
      givenName,
      middleName,
      emails,
      photos,
    })
    .set("Content-Type", "application/json")
    .set("Acccept", "application/json")
    .auth(authid, authcode);

  return res.body;
}

export async function update(
  username,
  password,
  provider,
  familyName,
  givenName,
  middleName,
  emails,
  photos
) {
  const res = await request
    .post(reqURL(`/update-user/${username}`))
    .send({
      username,
      password,
      provider,
      familyName,
      givenName,
      middleName,
      emails,
      photos,
    })
    .set("Content-Type", "application/json")
    .set("Acccept", "application/json")
    .auth(authid, authcode);

  return res.body;
}

export async function find(username) {
  const res = await request
    .get(reqURL(`/find/${username}`))
    .set("Content-Type", "application/json")
    .set("Acccept", "application/json")
    .auth(authid, authcode);

  return res.body;
}

export async function userPasswordCheck(username, password) {
  const res = await request
    .post(reqURL(`/password-check`))
    .send({ username, password })
    .set("Content-Type", "application/json")
    .set("Acccept", "application/json")
    .auth(authid, authcode);

  return res.body;
}

export async function findOrCreate(profile) {
  const res = await request
    .post(reqURL("/find-or-create"))
    .send({
      username: profile.id,
      password: profile.password,
      provider: profile.provider,
      familyName: profile.familyName,
      givenName: profile.givenName,
      middleName: profile.middleName,
      emails: profile.emails,
      photos: profile.photos,
    })
    .set("Content-Type", "application/json")
    .set("Acccept", "application/json")
    .auth(authid, authcode);

  return res.body;
}

export async function listUsers() {
  const res = await request
    .get(reqURL("/list"))
    .set("Content-Type", "application/json")
    .set("Acccept", "application/json")
    .auth(authid, authcode);

  return res.body;
}
