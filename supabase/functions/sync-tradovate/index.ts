import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradovateAuthResponse {
  accessToken: string;
  expirationTime: string;
  userId: number;
  name: string;
}

interface TradovateAccount {
  id: number;
  name: string;
  userId: number;
  accountType: string;
  active: boolean;
  marginAccountType: string;
}

interface TradovateFill {
  id: number;
  orderId: number;
  contractId: number;
  timestamp: string;
  tradeDate: { year: number; month: number; day: number };
  action: string; // 'Buy' or 'Sell'
  qty: number;
  price: number;
  active: boolean;
  finallyPaired: number;
}

interface TradovateContract {
  id: number;
  name: string;
  contractMaturityId: number;
}

interface TradovateOrder {
  id: number;
  accountId: number;
  contractId: number;
  timestamp: string;
  action: string;
  ordStatus: string;
  ordType: string;
  price?: number;
  stopPrice?: number;
  filledQty: number;
  avgFillPrice?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, connectionId, username, password, appId, cid, sec, deviceId } = body;

    console.log(`Processing action: ${action} for user: ${user.id}`);

    if (action === 'connect') {
      // Authenticate with Tradovate
      const environment = body.environment || 'demo';
      const baseUrl = environment === 'live' 
        ? 'https://live.tradovateapi.com/v1'
        : 'https://demo.tradovateapi.com/v1';

      console.log(`Attempting to authenticate with Tradovate (${environment})`);

      const authResponse = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username,
          password: password,
          appId: appId || 'Lovable Trading Journal',
          appVersion: '1.0.0',
          cid: cid,
          sec: sec,
          deviceId: deviceId || crypto.randomUUID(),
        }),
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('Tradovate auth error:', errorText);
        return new Response(JSON.stringify({ 
          error: 'Authentication failed', 
          details: errorText 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authData: TradovateAuthResponse = await authResponse.json();
      console.log('Successfully authenticated with Tradovate');

      // Get account list
      const accountsResponse = await fetch(`${baseUrl}/account/list`, {
        headers: { 'Authorization': `Bearer ${authData.accessToken}` },
      });

      const accounts: TradovateAccount[] = await accountsResponse.json();
      const activeAccount = accounts.find(a => a.active) || accounts[0];

      if (!activeAccount) {
        return new Response(JSON.stringify({ error: 'No accounts found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Save connection to database (without storing password)
      const { data: connection, error: insertError } = await supabase
        .from('broker_connections')
        .insert({
          user_id: user.id,
          broker_name: 'tradovate',
          account_id: String(activeAccount.id),
          account_name: activeAccount.name,
          username: username,
          environment: environment,
          is_active: true,
          portfolio_id: body.portfolioId || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to save connection' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        connection,
        accounts: accounts.map(a => ({ id: a.id, name: a.name, active: a.active })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sync') {
      // Get connection details
      const { data: connection, error: connError } = await supabase
        .from('broker_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        return new Response(JSON.stringify({ error: 'Connection not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Re-authenticate with provided credentials
      const baseUrl = connection.environment === 'live'
        ? 'https://live.tradovateapi.com/v1'
        : 'https://demo.tradovateapi.com/v1';

      const authResponse = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username,
          password: password,
          appId: appId || 'Lovable Trading Journal',
          appVersion: '1.0.0',
          cid: cid,
          sec: sec,
          deviceId: deviceId || crypto.randomUUID(),
        }),
      });

      if (!authResponse.ok) {
        return new Response(JSON.stringify({ error: 'Authentication failed for sync' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authData: TradovateAuthResponse = await authResponse.json();

      // Fetch fills (completed trades)
      const fillsResponse = await fetch(`${baseUrl}/fill/list`, {
        headers: { 'Authorization': `Bearer ${authData.accessToken}` },
      });
      
      const fills: TradovateFill[] = await fillsResponse.json();
      console.log(`Found ${fills.length} fills from Tradovate`);

      // Fetch contracts for symbol mapping
      const contractsResponse = await fetch(`${baseUrl}/contract/list`, {
        headers: { 'Authorization': `Bearer ${authData.accessToken}` },
      });
      const contracts: TradovateContract[] = await contractsResponse.json();
      const contractMap = new Map(contracts.map(c => [c.id, c.name]));

      // Group fills by order to create trades
      const orderFills = new Map<number, TradovateFill[]>();
      fills.forEach(fill => {
        const existing = orderFills.get(fill.orderId) || [];
        existing.push(fill);
        orderFills.set(fill.orderId, existing);
      });

      // Get existing external trade IDs to prevent duplicates
      const { data: existingTrades } = await supabase
        .from('trades')
        .select('external_trade_id')
        .eq('user_id', user.id)
        .not('external_trade_id', 'is', null);

      const existingIds = new Set((existingTrades || []).map(t => t.external_trade_id));

      // Create trades from fills
      const tradesToInsert = [];
      
      for (const [orderId, orderFillList] of orderFills) {
        const externalId = `tradovate_${orderId}`;
        
        if (existingIds.has(externalId)) {
          console.log(`Skipping duplicate trade: ${externalId}`);
          continue;
        }

        const firstFill = orderFillList[0];
        const symbol = contractMap.get(firstFill.contractId) || `Contract_${firstFill.contractId}`;
        const totalQty = orderFillList.reduce((sum, f) => sum + f.qty, 0);
        const avgPrice = orderFillList.reduce((sum, f) => sum + (f.price * f.qty), 0) / totalQty;
        
        const entryDate = new Date(firstFill.timestamp);
        const tradeType = firstFill.action === 'Buy' ? 'long' : 'short';

        tradesToInsert.push({
          user_id: user.id,
          portfolio_id: connection.portfolio_id,
          symbol: symbol,
          trade_type: tradeType,
          quantity: totalQty,
          entry_date: entryDate.toISOString(),
          entry_price: avgPrice,
          is_closed: false, // Will need exit info to close
          external_trade_id: externalId,
        });
      }

      console.log(`Inserting ${tradesToInsert.length} new trades`);

      if (tradesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('trades')
          .insert(tradesToInsert);

        if (insertError) {
          console.error('Failed to insert trades:', insertError);
          return new Response(JSON.stringify({ error: 'Failed to save trades' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Update last sync time
      await supabase
        .from('broker_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connectionId);

      return new Response(JSON.stringify({ 
        success: true, 
        imported: tradesToInsert.length,
        skipped: orderFills.size - tradesToInsert.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      const { error: deleteError } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (deleteError) {
        return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
