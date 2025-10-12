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

        expect(res.status).to.be.lt(300);
        return await res.json();
    }

    let userId: string, characterId: string, itemId: string;

    it("should create a user", async () => {
        const data = await callPostOnApi(`${apiUrl}/auth/register`, {});
        userId = data.user.id;
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
        const data = await callPostOnApi(`${apiUrl}/items`, { characterId });
        itemId = data.item.id;
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
});