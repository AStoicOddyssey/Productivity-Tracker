import { requireAuth } from './_auth.js';
import { supabase } from './_supabase.js';

export async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { type } = req.query;

  // ── TIMETABLES ────────────────────────────────────────────
  if (!type || type === 'timetable') {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('timetables')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title } = req.body;
      const { data, error } = await supabase
        .from('timetables')
        .insert({ user_id: user.user_id, title: title || 'New Timetable' })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const { id, title } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { data, error } = await supabase
        .from('timetables')
        .update({ title })
        .eq('id', id)
        .eq('user_id', user.user_id)
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('timetables')
        .delete()
        .eq('id', id)
        .eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  // ── ITEMS + SLOTS (full timetable load) ───────────────────
  // GET /api/timetables?type=items&timetable_id=xxx
  if (type === 'items') {
    if (req.method === 'GET') {
      const { timetable_id } = req.query;
      if (!timetable_id) return res.status(400).json({ error: 'timetable_id required' });
      const { data, error } = await supabase
        .from('timetable_items')
        .select('*, timetable_slots(*)')
        .eq('timetable_id', timetable_id)
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // POST — create item + slots in one call
    if (req.method === 'POST') {
      const { timetable_id, item_type, title, colour, course_type, instructor, location, slots } = req.body;
      if (!timetable_id || !title) return res.status(400).json({ error: 'timetable_id and title required' });

      const { data: item, error: itemErr } = await supabase
        .from('timetable_items')
        .insert({
          timetable_id, user_id: user.user_id,
          item_type: item_type || 'course',
          title, colour: colour || '#58a6ff',
          course_type: course_type || null,
          instructor: instructor || null,
          location: location || null
        })
        .select().single();
      if (itemErr) return res.status(500).json({ error: itemErr.message });

      if (slots?.length) {
        const slotRows = slots.map(s => ({
          item_id: item.id,
          user_id: user.user_id,
          days: s.days,
          start_time: s.start_time,
          end_time: s.end_time,
          location: s.location || null
        }));
        const { error: slotErr } = await supabase.from('timetable_slots').insert(slotRows);
        if (slotErr) return res.status(500).json({ error: slotErr.message });
      }

      // Return full item with slots
      const { data: full, error: fullErr } = await supabase
        .from('timetable_items')
        .select('*, timetable_slots(*)')
        .eq('id', item.id).single();
      if (fullErr) return res.status(500).json({ error: fullErr.message });
      return res.status(201).json(full);
    }

    // PATCH — update item + replace slots
    if (req.method === 'PATCH') {
      const { id, item_type, title, colour, course_type, instructor, location, slots } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });

      const updates = {};
      if (title       !== undefined) updates.title       = title;
      if (colour      !== undefined) updates.colour      = colour;
      if (course_type !== undefined) updates.course_type = course_type;
      if (instructor  !== undefined) updates.instructor  = instructor;
      if (location    !== undefined) updates.location    = location;
      if (item_type   !== undefined) updates.item_type   = item_type;

      const { error: itemErr } = await supabase
        .from('timetable_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.user_id);
      if (itemErr) return res.status(500).json({ error: itemErr.message });

      // Replace slots
      if (slots !== undefined) {
        await supabase.from('timetable_slots').delete().eq('item_id', id);
        if (slots.length) {
          const slotRows = slots.map(s => ({
            item_id: id,
            user_id: user.user_id,
            days: s.days,
            start_time: s.start_time,
            end_time: s.end_time,
            location: s.location || null
          }));
          const { error: slotErr } = await supabase.from('timetable_slots').insert(slotRows);
          if (slotErr) return res.status(500).json({ error: slotErr.message });
        }
      }

      const { data: full, error: fullErr } = await supabase
        .from('timetable_items')
        .select('*, timetable_slots(*)')
        .eq('id', id).single();
      if (fullErr) return res.status(500).json({ error: fullErr.message });
      return res.status(200).json(full);
    }

    // DELETE item
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await supabase
        .from('timetable_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.user_id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).end();
}
