import { describe, it } from "node:test";
import { expect } from "chai";

/**
 * Important note
 * API and DB must be running for these tests to work
 */
describe("Character", () => {
    const url = "http://localhost:3000";
    const apiUrl = `${url}/api`;
    fetch(`${url}/health`).then(res => expect(res.status).to.be.lt(300));

    const callPostOnApi = async (src: string, body: any) => {
        const res = await fetch(src, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        expect(res.status, data.message || "").to.be.lt(300);
        return data;
    }

    let userId: string, characterId: string, itemId: string;

    it("should create a user", async () => {
        const data = await callPostOnApi(`${apiUrl}/auth/register`, {});
        userId = data.userId;
    });

    it("should create a character", async () => {
        const data = await callPostOnApi(`${apiUrl}/characters/generate`, { userId });
        characterId = data.character.id;
    });

    it("should get a character", async () => {
        const res = await fetch(`${apiUrl}/characters/${characterId}`, {
            method: "GET",
        });
        expect(res.status).to.be.lt(300);
    });

    it("should create an item", async () => {
        const data = await callPostOnApi(`${apiUrl}/items`, { characterId, userId, choice: 0 });
        console.log("data", ...data.items);
    });

    it("should get all items", async () => {
        const res = await fetch(`${apiUrl}/items/character/${characterId}`, {
            method: "GET",
        });
        expect(res.status).to.be.lt(300);
        const data = await res.json();
        expect(data.items.length).to.be.greaterThan(0);
        itemId = data.items[0].id;
    });

    it("should get an item", async () => {
        const res = await fetch(`${apiUrl}/items/${itemId}`, {
            method: "GET",
        });
        expect(res.status).to.be.lt(300);
    });

    it("should equip an item", async () => {
        await callPostOnApi(`${apiUrl}/items/equip`, { itemId, slot: 1 });

        const res2 = await fetch(`${apiUrl}/characters/${characterId}`, {
            method: "GET",
        });
        expect(res2.status).to.be.lt(300);
        const characterData = await res2.json();
        expect(characterData.character.damage_rating).to.be.greaterThan(0);
    });

    it("should unequip an item", async () => {
        await callPostOnApi(`${apiUrl}/items/unequip`, { itemId });

        const res2 = await fetch(`${apiUrl}/characters/${characterId}`, {
            method: "GET",
        });
        expect(res2.status).to.be.lt(300);
        const characterData = await res2.json();
        expect(characterData.character.damage_rating).to.be.eq(0);
    });

    it("should find dungeon run for user", async () => {
        const res = await fetch(`${apiUrl}/dungeon/character/${characterId}/runs`, {
            method: "GET",
        });
        expect(res.status).to.be.lt(300);
        const runs = await res.json();
        expect(runs.runs.length).to.be.greaterThan(0);

        const run = runs.runs[0];
        const endAt = new Date(new Date(run.started_at).getTime() + run.duration_seconds * 1000);
        console.log("endAt", endAt);
        await delay(endAt.getTime() - Date.now());

        for (let i = 0; i < 10; i++) {
            const res2 = await fetch(`${apiUrl}/dungeon/character/${characterId}/unclaimed`, {
                method: "GET",
            });
            if ((await res2.json()).runs.length > 0) {
                break;
            }

            await delay(1000);
        }

        console.log("unclaimed runs");
        const res2 = await fetch(`${apiUrl}/dungeon/character/${characterId}/unclaimed`, {
            method: "GET",
        });
        expect(res2.status).to.be.lt(300);
        const unclaimedRuns = await res2.json();
        expect(unclaimedRuns.runs.length).to.be.greaterThan(0);

        const res3 = await callPostOnApi(`${apiUrl}/dungeon/claim`, {
            dungeonRunId: unclaimedRuns.runs[0].id,
            userId,
        });
        expect(res.status).to.be.lt(300);

        const res4 = await fetch(`${apiUrl}/dungeon/character/${characterId}/unclaimed`, {
            method: "GET",
        });
        expect(res4.status).to.be.lt(300);
        const unclaimedRuns1 = await res4.json();
        expect(unclaimedRuns1.runs.length).to.be.eq(0);
    });
});

function delay(arg0: number) {
    return new Promise(resolve => setTimeout(resolve, arg0));
}
