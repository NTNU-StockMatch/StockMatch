<!-- src/routes/[symbol]/+page.svelte -->
<script lang="ts">
    export let data: {
      profile: any;
      symbol: string;
    };
  </script>
  
  <h1>{data.profile.name}（{data.symbol}）</h1>
  <p>暱稱：{data.profile.nickname}</p>
  <p>個性：{data.profile.personality}</p>
  <p>描述：{data.profile.description}</p>
  <ul>
    {#each data.profile.tags as tag}
      <li>🏷️ {tag}</li>
    {/each}
  </ul>
  