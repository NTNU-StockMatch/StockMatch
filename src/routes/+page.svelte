<script lang="ts">
    import { onMount } from 'svelte';
    import { auth, provider, db } from '$lib/firebase';
    import { signInWithPopup, onAuthStateChanged , signOut} from 'firebase/auth';
    import { collection, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
  
    interface StockWithAI {
    id: string;
    name?: string;
    industry?: string;
    market?: string;
    [key: string]: any;
    aiProfile?: {
        description?: string;
        personality?: string;
        score?: number;
        [key: string]: any;
      };
    }

    let user: any = null;
    let stocks: StockWithAI[] = [];
    let current = 0;
  
    async function loginWithGoogle() {
      const result = await signInWithPopup(auth, provider);
      user = result.user;
      await setDoc(doc(db, 'users', user.uid, 'profile'), {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        joinedAt: new Date()
      }, { merge: true });
      // await loadStocksWithAIProfile();
    }
  
    async function logout() {
      try {
        await signOut(auth);
        user = null;
      } catch (err) {
        console.error("登出失敗", err);
      }
    }


    // async function loadStocks() {
    //   const querySnapshot = await getDocs(collection(db, 'stocks'));
    //   stocks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   console.log(stocks);
    //   current = 0;
    // }

    export async function loadStocksWithAIProfile(): Promise<StockWithAI[]> {
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

        const stocksRef = collection(db, 'stocks');
        const snapshot = await getDocs(stocksRef);
        
        const likedSnapshot = await getDocs(collection(db, 'users', user.uid, 'likes'));
        const likedIds = likedSnapshot.docs.map(doc => doc.id);

        const stocks: StockWithAI[] = [];

        for (const stockDoc of snapshot.docs) {
            if(likedIds.includes(stockDoc.id)){
              continue;
            }
            const baseData = { id: stockDoc.id, ...stockDoc.data() };

            try {
              const aiRef = doc(db, 'stocks', stockDoc.id, 'ai_profile', 'summary');
              const aiSnap = await getDoc(aiRef);
              if (aiSnap.exists()) {
                  baseData.aiProfile = aiSnap.data();
              }
            } catch (err) {
              console.warn(`讀取 ${stockDoc.id} 的 ai_profile 失敗:`, err);
            }

            stocks.push(baseData);
        }
        console.log(stocks);
        return stocks;
        }
  
    async function handleSwipe(like: boolean) {
      if (!user || current >= stocks.length) return;
  
      const stock = stocks[current];
      const ref = doc(db, 'users', user.uid, 'likes', stock.id);
      if (like) {
        await setDoc(ref, { likedAt: new Date() });
      }
      current++;
    }
  
    onMount(() => {
      onAuthStateChanged(auth, async (u) => {
        user = u;
        if (user) {
          // await loadStocks();
          stocks = await loadStocksWithAIProfile();
        }
      });
    });
  </script>
  
  <h1>StockMatch</h1>
  <h1 class="text-4xl font-bold text-center mt-8 text-indigo-600">StockMatch</h1>

  {#if !user}
    <div class="flex justify-center mt-10">
      <button 
        on:click={loginWithGoogle}
        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-200"
      >
        使用 Google 登入
      </button>
    </div>
  {:else if current < stocks.length}
    <div class="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <h2 class="text-2xl font-bold text-gray-800">{stocks[current].name}</h2>
      <p class="text-gray-600">{stocks[current].aiProfile?.description}</p>
      <p class="text-sm text-gray-400">市場：{stocks[current].market}</p>
  
      <div class="flex flex-wrap gap-2 mt-4">
        {#each stocks[current].aiProfile?.tags as tag}
          <span class="bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full">{tag}</span>
        {/each}
      </div>
  
      <div class="flex justify-around mt-6">
        <button 
          on:click={() => handleSwipe(false)}
          class="bg-red-100 hover:bg-red-200 text-red-600 font-bold py-2 px-6 rounded-full transition"
        >
          👎 左滑
        </button>
        <button 
          on:click={() => handleSwipe(true)}
          class="bg-green-100 hover:bg-green-200 text-green-600 font-bold py-2 px-6 rounded-full transition"
        >
          👍 右滑
        </button>
      </div>
    </div>
  
    <div class="flex justify-center mt-6">
      <button 
        on:click={logout}
        class="text-sm text-gray-500 hover:underline"
      >
        登出
      </button>
    </div>
  {:else}
    <div class="text-center mt-10">
      <p class="text-lg text-gray-700">你已經看完所有股票！</p>
      <button 
        on:click={logout}
        class="mt-4 text-sm text-gray-500 hover:underline"
      >
        登出
      </button>
    </div>
  {/if}
  
  

  