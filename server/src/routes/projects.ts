import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';

const router = Router();

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

/**
 * Get all projects for the current user
 * GET /api/projects
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_items(count)
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      data: (projects || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        itemCount: p.project_items?.[0]?.count || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch projects',
    });
  }
});

/**
 * Create a new project
 * POST /api/projects
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Project name is required',
      });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: req.user!.id,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        itemCount: 0,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create project',
    });
  }
});

/**
 * Get a single project with its items
 * GET /api/projects/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Get items in this project
    const { data: items, error: itemsError } = await supabase
      .from('project_items')
      .select(`
        job_id,
        added_at,
        jobs (
          id,
          video_id,
          title,
          channel_title,
          duration,
          url,
          status,
          created_at
        )
      `)
      .eq('project_id', id);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        items: (items || []).map(item => ({
          id: (item.jobs as any)?.id,
          videoId: (item.jobs as any)?.video_id,
          title: (item.jobs as any)?.title,
          channelTitle: (item.jobs as any)?.channel_title,
          duration: (item.jobs as any)?.duration,
          url: (item.jobs as any)?.url,
          status: (item.jobs as any)?.status,
          addedAt: item.added_at,
          createdAt: (item.jobs as any)?.created_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project',
    });
  }
});

/**
 * Update a project
 * PUT /api/projects/:id
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Project name is required',
      });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update project',
    });
  }
});

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete project',
    });
  }
});

/**
 * Add an item to a project
 * POST /api/projects/:id/items
 */
router.post('/:id/items', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required',
      });
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('user_id', req.user!.id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Content item not found',
      });
    }

    // Add item to project
    const { error: insertError } = await supabase
      .from('project_items')
      .insert({
        project_id: id,
        job_id: jobId,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'Item already exists in project',
        });
      }
      throw new Error(insertError.message);
    }

    res.json({
      success: true,
      message: 'Item added to project',
    });
  } catch (error: any) {
    console.error('Add project item error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add item to project',
    });
  }
});

/**
 * Remove an item from a project
 * DELETE /api/projects/:id/items/:jobId
 */
router.delete('/:id/items/:jobId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, jobId } = req.params;

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const { error } = await supabase
      .from('project_items')
      .delete()
      .eq('project_id', id)
      .eq('job_id', jobId);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: 'Item removed from project',
    });
  } catch (error: any) {
    console.error('Remove project item error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove item from project',
    });
  }
});

export default router;
