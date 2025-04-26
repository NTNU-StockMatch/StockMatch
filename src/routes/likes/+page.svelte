<script lang="ts">
    import { onMount } from "svelte";
    import { auth, db } from "$lib/firebase";
    import {
        collection,
        getDocs,
        doc,
        getDoc,
        deleteDoc,
    } from "firebase/firestore";

    let user: any = null;
    let likedStocks: any[] = [];

    onMount(async () => {
        auth.onAuthStateChanged(async (u) => {
            if (u) {
                user = u;
                await loadLikedStocks();
            }
        });
    });

    async function loadLikedStocks() {
        const likesSnap = await getDocs(
            collection(db, "users", user.uid, "likes"),
        );
        const promises = likesSnap.docs.map(async (likeDoc) => {
            const stockId = likeDoc.id;
            const stockSnap = await getDoc(doc(db, "stocks", stockId));
            const aiSnap = await getDoc(
                doc(db, "stocks", stockId, "ai_profile", "summary"),
            );
            return {
                id: stockId,
                likedAt: likeDoc.data().likedAt?.toDate().toLocaleString(),
                ...stockSnap.data(),
                aiProfile: aiSnap.exists() ? aiSnap.data() : null,
            };
        });

        likedStocks = await Promise.all(promises);
    }

    async function removeLike(stockId: string) {
        await deleteDoc(doc(db, "users", user.uid, "likes", stockId));
        likedStocks = likedStocks.filter((s) => s.id !== stockId);
    }
</script>

<h1 class="text-3xl font-bold text-center mt-8 text-pink-600">
    ❤️ 我的喜歡清單
</h1>

{#if likedStocks.length === 0}
    <p class="text-center text-gray-500 mt-6">目前還沒有收藏的股票喔！</p>
{:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {#each likedStocks as stock}
            <div
                class="bg-white shadow-md rounded-2xl p-5 space-y-3 border border-gray-100 hover:shadow-lg transition"
            >
                <h2 class="text-xl font-semibold text-gray-800">
                    {stock.name}
                </h2>

                <button
                    on:click={() => removeLike(stock.id)}
                    class="mt-3 inline-block text-sm text-red-500 hover:text-red-700 hover:underline"
                >
                    ❌ 取消喜歡
                </button>
            </div>
        {/each}
    </div>
{/if}


